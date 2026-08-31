import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as outbox from '@/src/lib/chatOutbox';
import { HttpError, toUserMessage } from '@/src/lib/errors';
import type { OutboxMessage } from '@/src/features/tickets/types/chat-outbox.types';
import type { StaffAddCommentPayload } from '@/src/features/staff/types/staff.types';

/** Calls the real BE — injected by the screen (customer/staff service) to avoid cross-feature imports. */
export type ChatSendFn = (ticketId: string, payload: StaffAddCommentPayload) => Promise<unknown>;

interface Options {
  ticketId: string;
  pending: OutboxMessage[];
  send: ChatSendFn;
  /** Called after a message sends successfully — used to invalidate the chats query. */
  onSent: () => void | Promise<void>;
}

// GH-866 (Web) — BE returns the error code inside `message` (ChatAddCommandHandler.Fail), there's
// no separate errorCode field. Mobile's axios interceptor already unwraps the response into
// HttpError, so error.message IS that raw BE message — same string toUserMessage() maps.
const CHAT_SPAM_CHECK_IN_PROGRESS = 'CHAT_SPAM_CHECK_IN_PROGRESS';
const CHAT_DUPLICATE_MESSAGE_LIMIT = 'CHAT_DUPLICATE_MESSAGE_LIMIT';

// BE error code → display text. These codes make retry pointless, so state the reason plainly.
function failReasonOf(error: unknown): string | undefined {
  if (!(error instanceof HttpError)) return undefined;
  if (error.message === CHAT_DUPLICATE_MESSAGE_LIMIT) {
    return toUserMessage(CHAT_DUPLICATE_MESSAGE_LIMIT);
  }
  return undefined;
}

// 4xx errors (except 408/429) are caused by the payload → don't retry, fail immediately so the user can fix/discard.
function isRetriable(error: unknown): boolean {
  if (error instanceof HttpError) {
    const status = error.statusCode;
    if (status === 408 || status === 429) return true;
    // 409 CHAT_SPAM_CHECK_IN_PROGRESS: the user's spam check is running concurrently —
    // a temporary state, back off then resend. Other 409s still fail immediately.
    if (status === 409 && error.message === CHAT_SPAM_CHECK_IN_PROGRESS) return true;
    return status >= 500;
  }
  return true; // network/timeout (not an HttpError) → retry
}

/**
 * Worker that sends the outbox sequentially for a ticket (mounted once per screen showing the thread).
 *
 * Each pass only processes the first message still "queued" (FIFO — preserves typing order):
 *   - past deadline → "failed" (stops, waits for the user to hit retry)
 *   - retriable error → increments attempt, reschedules with backoff (2s→4s→…→30s)
 *   - client error → "failed" immediately
 *   - success → onSent() (awaited, so the real message is on screen) → removed from the outbox
 *
 * When `pending` changes (via enqueue/retry/patch), the effect reruns → triggers the next pass.
 * Mirrors frontend/src/shared/hooks/ticket/useChatOutboxWorker.ts.
 */
export function useChatOutboxWorker({ ticketId, pending, send, onSent }: Options) {
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keeps the latest ref so the timeout callback doesn't use a stale closure.
  const sendRef = useRef(send);
  const onSentRef = useRef(onSent);
  useEffect(() => {
    sendRef.current = send;
    onSentRef.current = onSent;
  });

  // Holds the latest tick() so the AppState effect below can kick the loop without
  // depending on it directly (tick is redefined on every `pending` change).
  const tickRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const tick = async () => {
      if (busyRef.current) return;
      const snapshot = outbox.getSnapshot(ticketId);
      const next = snapshot.find((m) => m.status === 'queued');
      if (!next) return;

      if (Date.now() > next.deadline) {
        outbox.patch(ticketId, next.tempId, { status: 'failed' });
        return; // effect reruns → processes the next message
      }

      busyRef.current = true;
      outbox.patch(ticketId, next.tempId, { status: 'sending' });
      try {
        await sendRef.current(next.ticketId, next.payload);
        // Refetch the thread BEFORE dropping the optimistic bubble. Removing it first left a
        // gap: the placeholder disappeared while the real message was still in flight, so the
        // message blinked out for about a second before reappearing.
        await onSentRef.current();
        outbox.remove(ticketId, next.tempId);
      } catch (error) {
        const attempt = next.attempt + 1;
        if (!isRetriable(error) || Date.now() > next.deadline) {
          outbox.patch(ticketId, next.tempId, {
            status: 'failed',
            attempt,
            failReason: failReasonOf(error),
          });
        } else {
          // Revert to "queued" and schedule a retry after the backoff.
          outbox.patch(ticketId, next.tempId, { status: 'queued', attempt });
          clearTimer();
          timerRef.current = setTimeout(() => {
            busyRef.current = false;
            void tick();
          }, outbox.backoffDelay(attempt));
          return; // stay busy until the timer fires again
        }
      } finally {
        // For the success/failed/deadline branches: release so the next message can be processed.
        if (!timerRef.current) busyRef.current = false;
      }
      void tick();
    };

    tickRef.current = tick;
    void tick();
    return clearTimer;
    // pending is a dependency: every enqueue/retry/patch re-triggers the send loop.
  }, [ticketId, pending]);

  // App was backgrounded mid-backoff (setTimeout may get suspended by the OS) — resume the
  // loop immediately on return instead of waiting for the next enqueue/retry to trigger it.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        busyRef.current = false;
        void tickRef.current();
      }
    });
    return () => sub.remove();
  }, []);
}
