import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { ticketService } from '../services/ticket.service';

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      ticketService.addComment(ticketId, { body, isInternal: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.detail(ticketId) });
    },
  });
}
