import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketService } from '../services/ticket.service';
import { RatePayload } from '../types/ticket.types';

export function useRateTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RatePayload) => ticketService.rate(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: KEY.tickets });
    },
  });
}
