import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '../../../lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';

export function useResumeTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => staffTicketService.resume(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
    },
  });
}
