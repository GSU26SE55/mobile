import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateTicketLifecycle } from '../utils/invalidateTicketLifecycle';
import { ticketService } from '../services/ticket.service';
import { ReopenPayload } from '../types/ticket.types';

export function useReopenTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReopenPayload) => ticketService.reopen(ticketId, data),
    onSuccess: () => {
      invalidateTicketLifecycle(queryClient, ticketId);
    },
  });
}
