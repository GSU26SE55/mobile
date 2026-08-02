import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketChatActionsService } from '../services/ticketChatActions.service';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { handleErrorApi } from '../../../lib/errors';
import { UpdateChatPayload } from '../types/chat-actions.types';
import { ChatAiIntentEnum } from '../../../shared/enums/chat.enum';

// Invalidate sau mutation — belt-and-suspenders cùng realtime (ChatEdited/ChatDeleted
// trong useTicketCommentsRealtime cũng invalidate key này khi hub báo về).
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

// Báo đã đọc — tác vụ nền nên lỗi chỉ nuốt (không Alert), tránh làm phiền user.
// Thành công thì phải invalidate unread count: badge ở header ticket detail đọc
// key này, không invalidate thì số treo nguyên dù user đã xem hết tin.
export function useMarkTicketChatsRead(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatIds: string[]) =>
      ticketChatActionsService.markRead(ticketId, { chatIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
      });
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
 * GH-83 — thử lại việc chuyển giọng nói → văn bản khi lần trước Failed.
 *
 * BE trả 202: nhận việc rồi xử lý nền, response không mang kết quả. Vì vậy chỉ invalidate danh sách
 * chat để lấy trạng thái mới — không setQueryData từ response.
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
// Các hook AI/pin dưới KHÔNG cần check res.data.isSuccess: axios interceptor tự reject
// 200+isSuccess:false (Gemini rate-limit, pin đủ 3...) → rơi vào onError → handleErrorApi.

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

// AI — mutateAsync resolve thẳng DTO để component dùng (chèn suggestion / hiện modal / badge).
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
