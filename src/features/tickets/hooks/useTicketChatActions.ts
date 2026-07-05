import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketChatActionsService } from '../services/ticketChatActions.service';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { handleErrorApi } from '../../../lib/errors';
import { UpdateChatPayload } from '../types/chat-actions.types';

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

// Housekeeping — báo đã đọc, không có unread badge trên mobile để wire nên lỗi
// chỉ nuốt (không Alert), tránh làm phiền người dùng vì 1 tác vụ nền.
export function useMarkTicketChatsRead(ticketId: string) {
  return useMutation({
    mutationFn: (chatIds: string[]) =>
      ticketChatActionsService.markRead(ticketId, { chatIds }),
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
