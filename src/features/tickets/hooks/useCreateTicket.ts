import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '../../../lib/queryKeys';
import { ticketService } from '../services/ticket.service';
import { CreateTicketPayload } from '../types/ticket.types';

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketPayload) => ticketService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.tickets });
    },
  });
}
