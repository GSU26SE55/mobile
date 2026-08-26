import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatOutbox } from './useChatOutbox';
import { useChatOutboxWorker, type ChatSendFn } from './useChatOutboxWorker';
import { QUERY_KEY } from '@/src/lib/queryKeys';

/**
 * Combines outbox + worker + invalidation for a ticket — the screen only needs one line.
 *
 * The screen injects `send` (its own addComment service call) to avoid cross-feature imports.
 * Returns `pending` (rendered as optimistic bubbles by the comment thread) and `retry`/`discard`
 * (tapping the red "Retry" line / discarding a message). The worker is always mounted here.
 *
 * Mirrors frontend/src/shared/hooks/ticket/useChatSender.ts.
 */
export function useChatSender(ticketId: string, send: ChatSendFn) {
  const qc = useQueryClient();
  const { pending, enqueue, retry, discard } = useChatOutbox(ticketId);

  const onSent = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
  }, [qc, ticketId]);

  useChatOutboxWorker({ ticketId, pending, send, onSent });

  return { pending, enqueue, retry, discard };
}
