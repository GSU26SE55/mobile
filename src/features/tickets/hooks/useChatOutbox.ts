import { useCallback, useEffect, useSyncExternalStore } from 'react';
import * as outbox from '@/src/lib/chatOutbox';
import type { StaffAddCommentPayload } from '@/src/features/staff/types/staff.types';

/**
 * Reads + operates on the pending message queue for a ticket's outbox.
 *
 * - `pending`: list of messages waiting (queued/sending/failed) — the thread renders these
 *   as optimistic bubbles with a status line ("Sending…" / red "Retry").
 * - `enqueue`: called by the composer on send (doesn't await BE).
 * - `retry`: tapping the red "Retry" line → resends that exact message.
 * - `discard`: drops a message from the queue entirely.
 *
 * The actual BE call is handled by useChatOutboxWorker (sequential + backoff).
 *
 * Mirrors frontend/src/shared/hooks/ticket/useChatOutbox.ts — mobile additionally hydrates the
 * queue from AsyncStorage on mount, since (unlike Web's localStorage) AsyncStorage can't be read
 * synchronously at store-creation time.
 */
export function useChatOutbox(ticketId: string) {
  useEffect(() => {
    void outbox.hydrate(ticketId);
  }, [ticketId]);

  const pending = useSyncExternalStore(
    outbox.subscribe,
    () => outbox.getSnapshot(ticketId),
    () => outbox.getSnapshot(ticketId),
  );

  const enqueue = useCallback(
    (payload: StaffAddCommentPayload) => outbox.enqueue(ticketId, payload, Date.now()),
    [ticketId],
  );

  const retry = useCallback(
    (tempId: string) => outbox.requeue(ticketId, tempId, Date.now()),
    [ticketId],
  );

  const discard = useCallback((tempId: string) => outbox.remove(ticketId, tempId), [ticketId]);

  return { pending, enqueue, retry, discard };
}
