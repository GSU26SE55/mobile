import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  OutboxMessage,
  OutboxStatus,
} from '@/src/features/tickets/types/chat-outbox.types';
import type { StaffAddCommentPayload } from '@/src/features/staff/types/staff.types';

/**
 * Chat outbox — queue of messages waiting to send, persisted across app restarts, per-ticket FIFO.
 *
 * Mirrors the Web outbox (frontend/src/shared/lib/chatOutbox.ts): a plain store (outside React)
 * shared by the composer (enqueue), the worker (sends sequentially), and the thread (renders the
 * "sending"/"failed" bubble), wired into React via useSyncExternalStore in useChatOutbox.
 *
 * Unlike Web's localStorage (synchronous), AsyncStorage is async — so this store keeps an
 * in-memory cache as the source of truth for getSnapshot() (must return synchronously), and
 * writes to AsyncStorage happen in the background (fire-and-forget) after every mutation.
 * hydrate() reads AsyncStorage once per ticket on first use to restore the queue across restarts.
 */

const KEY_PREFIX = 'chat-outbox:';
const SEQ_KEY = 'chat-outbox:seq';

/** Total retry time before giving up and marking as "failed". */
export const OUTBOX_TOTAL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
/** Backoff: delay for the nth attempt = min(2^n * BASE, MAX). */
export const OUTBOX_BACKOFF_BASE_MS = 1000;
export const OUTBOX_BACKOFF_MAX_MS = 30_000;

function storageKey(ticketId: string) {
  return `${KEY_PREFIX}${ticketId}`;
}

// In-memory cache, source of truth for synchronous reads (getSnapshot). Persisted to
// AsyncStorage in the background on every mutation.
const snapshotCache = new Map<string, OutboxMessage[]>();
const hydrated = new Set<string>();
const EMPTY: OutboxMessage[] = [];

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Subscribes to any outbox change (across all tickets). */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable snapshot of the outbox for 1 ticket (rebuilt only on mutation). Synchronous — reads the in-memory cache, not AsyncStorage. Call hydrate() first to restore a persisted queue. */
export function getSnapshot(ticketId: string): OutboxMessage[] {
  return snapshotCache.get(ticketId) ?? EMPTY;
}

/** Reads the persisted queue for a ticket from AsyncStorage into the in-memory cache, once. No-op on subsequent calls (the cache stays authoritative afterward). */
export async function hydrate(ticketId: string): Promise<void> {
  if (hydrated.has(ticketId)) return;
  hydrated.add(ticketId);
  try {
    const raw = await AsyncStorage.getItem(storageKey(ticketId));
    const parsed = raw ? (JSON.parse(raw) as OutboxMessage[]) : [];
    if (Array.isArray(parsed) && parsed.length > 0) {
      snapshotCache.set(ticketId, parsed);
      emit();
    }
  } catch {
    // AsyncStorage unavailable/corrupted — keep an empty queue for this ticket.
  }
}

function writeRaw(ticketId: string, messages: OutboxMessage[]) {
  snapshotCache.set(ticketId, messages);
  emit();
  // Persist in the background — the in-memory cache above is already the source of truth for reads.
  void (async () => {
    try {
      if (messages.length === 0) {
        await AsyncStorage.removeItem(storageKey(ticketId));
      } else {
        await AsyncStorage.setItem(storageKey(ticketId), JSON.stringify(messages));
      }
    } catch {
      // AsyncStorage full/unavailable — the in-memory copy still works for this session.
    }
  })();
}

async function nextSeq(): Promise<number> {
  try {
    const seq = Number((await AsyncStorage.getItem(SEQ_KEY)) ?? '0') + 1;
    await AsyncStorage.setItem(SEQ_KEY, String(seq));
    return seq;
  } catch {
    return Date.now(); // fallback when AsyncStorage errors — only needs to be unique
  }
}

/** Adds a message to the end of the ticket's queue, returns the newly created message. */
export async function enqueue(
  ticketId: string,
  payload: StaffAddCommentPayload,
  now: number,
): Promise<OutboxMessage> {
  const msg: OutboxMessage = {
    tempId: `temp-${ticketId}-${await nextSeq()}`,
    ticketId,
    payload,
    status: 'queued',
    attempt: 0,
    createdAt: now,
    deadline: now + OUTBOX_TOTAL_TIMEOUT_MS,
  };
  writeRaw(ticketId, [...getSnapshot(ticketId), msg]);
  return msg;
}

/** Partially updates a message's fields by tempId. */
export function patch(
  ticketId: string,
  tempId: string,
  partial: Partial<Pick<OutboxMessage, 'status' | 'attempt' | 'deadline' | 'failReason'>>,
) {
  const next = getSnapshot(ticketId).map((m) => (m.tempId === tempId ? { ...m, ...partial } : m));
  writeRaw(ticketId, next);
}

/** Removes a message from the queue (sent successfully or discarded by the user). */
export function remove(ticketId: string, tempId: string) {
  const next = getSnapshot(ticketId).filter((m) => m.tempId !== tempId);
  writeRaw(ticketId, next);
}

/** Moves a "failed" message back to "queued" and extends the deadline so the worker retries it. */
export function requeue(ticketId: string, tempId: string, now: number) {
  const next = getSnapshot(ticketId).map((m) =>
    m.tempId === tempId
      ? {
          ...m,
          status: 'queued' as OutboxStatus,
          attempt: 0,
          deadline: now + OUTBOX_TOTAL_TIMEOUT_MS,
        }
      : m,
  );
  writeRaw(ticketId, next);
}

/** Computes the backoff delay for the next attempt based on the number of attempts so far. */
export function backoffDelay(attempt: number): number {
  return Math.min(OUTBOX_BACKOFF_BASE_MS * 2 ** attempt, OUTBOX_BACKOFF_MAX_MS);
}
