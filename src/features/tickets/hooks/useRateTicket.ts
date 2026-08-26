import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateTicketLifecycle } from '../utils/invalidateTicketLifecycle';
import { ticketService } from '../services/ticket.service';
import { RatePayload } from '../types/ticket.types';

export function useRateTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RatePayload) => ticketService.rate(ticketId, data),
    onSuccess: () => {
      invalidateTicketLifecycle(queryClient, ticketId);
    },
  });
}
