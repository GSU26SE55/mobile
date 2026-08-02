import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketService } from '../services/ticket.service';
import { ReopenPayload } from '../types/ticket.types';

export function useReopenTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReopenPayload) => ticketService.reopen(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: KEY.tickets });
    },
  });
}
