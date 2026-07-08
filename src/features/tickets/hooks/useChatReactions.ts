import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { handleErrorApi } from '../../../lib/errors';
import { ticketChatActionsService } from '../services/ticketChatActions.service';
import { ReactionTypeEnum } from '../types/ticket.types';

// GH-68 — thêm/gỡ reaction. BE trả aggregate mới; invalidate chats(id) để cursor list
// refetch count (reactions được populate trong list handler). Optimistic ở component.
export function useAddReaction(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, reactionType }: { chatId: string; reactionType: ReactionTypeEnum }) =>
      ticketChatActionsService.addReaction(ticketId, chatId, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useRemoveReaction(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, type }: { chatId: string; type: ReactionTypeEnum }) =>
      ticketChatActionsService.removeReaction(ticketId, chatId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
