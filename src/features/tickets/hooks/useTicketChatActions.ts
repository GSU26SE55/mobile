import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketChatActionsService } from '../services/ticketChatActions.service';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { handleErrorApi } from '@/src/lib/errors';
import { UpdateChatPayload } from '../types/chat-actions.types';
import { ChatAiIntentEnum } from '@/src/features/tickets/enums/chat.enum';

// Invalidate after mutation — belt-and-suspenders alongside realtime (ChatEdited/ChatDeleted
// in useTicketCommentsRealtime also invalidate this key when the hub reports back).
export function useUpdateTicketChat(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, payload }: { chatId: string; payload: UpdateChatPayload }) =>
      ticketChatActionsService.update(ticketId, chatId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useDeleteTicketChat(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, reason }: { chatId: string; reason?: string }) =>
      ticketChatActionsService.remove(ticketId, chatId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

// Delete multiple chats at once. Returns ChatBulkDeleteResultDTO so the caller can report the
// actual count — BE supports partial success, not all-or-nothing.
export function useBulkDeleteTicketChats(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatIds: string[]) =>
      ticketChatActionsService
        .bulkRemove(ticketId, { chatIds })
        .then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

// Mark as read — a background task, so errors are just swallowed (no Alert) to avoid
// bothering the user. On success, must invalidate the unread count: the badge in the
// ticket detail header reads this key, so without invalidating, the count stays stuck
// even after the user has read everything.
export function useMarkTicketChatsRead(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatIds: string[]) =>
      ticketChatActionsService.markRead(ticketId, { chatIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
      });
      // The chat list carries `isRead` per message and CommentThread draws the unread
      // divider from it. Without invalidating, the cached list keeps every message at
      // isRead=false, so re-entering the chat shows the divider again over messages that
      // were already read.
      //
      // The delay is required, not cosmetic. A 200 here only means the read receipts were
      // queued: TicketService writes them from ChatReadReceiptBulkWriter, which flushes on
      // a 1s interval (FlushInterval in ChatReadReceiptBulkWriter.cs). Refetching straight
      // away reads the database before that flush, gets isRead=false back, and marks the
      // query fresh again — which is worse than not invalidating at all.
      //
      // If the backend ever writes read receipts synchronously, drop the timeout.
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEY.tickets.chats(ticketId),
        });
      }, 1_500);

      // The divider currently on screen does not move when the refetch lands: it is pinned
      // to a message id for the whole viewing session (see CommentThread).
    },
    onError: () => {},
  });
}

export function useTranslateTicketChat(ticketId: string) {
  return useMutation({
    mutationFn: ({ chatId, targetLanguage }: { chatId: string; targetLanguage: string }) =>
      ticketChatActionsService.translate(ticketId, chatId, targetLanguage),
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useTranscribeVoiceChat(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (audioFile: { uri: string; name: string; type: string }) =>
      ticketChatActionsService.transcribeVoice(ticketId, audioFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

/**
 * GH-83 — retry voice-to-text conversion when the previous attempt Failed.
 *
 * BE returns 202: accepts the job and processes it in the background, the response carries no
 * result. So we only invalidate the chat list to fetch the new status — no setQueryData from
 * the response.
 */
export function useRetryVoiceChat(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => ticketChatActionsService.retryVoice(ticketId, chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

// ── GH-67 — Staff/Manager/Admin ──────────────────────────────────────────
// The AI/pin hooks below do NOT need to check res.data.isSuccess: the axios interceptor
// auto-rejects 200+isSuccess:false (Gemini rate-limit, pin limit of 3 reached, etc.) →
// falls into onError → handleErrorApi.

export function usePinChat(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => ticketChatActionsService.pin(ticketId, chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useUnpinChat(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => ticketChatActionsService.unpin(ticketId, chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

// AI — mutateAsync resolves directly to the DTO for the component to use (insert suggestion / show modal / badge).
export function useSuggestChat(ticketId: string) {
  return useMutation({
    mutationFn: async (intent: ChatAiIntentEnum) => {
      const res = await ticketChatActionsService.suggest(ticketId, intent);
      return res.data.data;
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useSummarizeThread(ticketId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await ticketChatActionsService.summarize(ticketId);
      return res.data.data;
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
