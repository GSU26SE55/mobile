import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { handleErrorApi } from '@/src/lib/errors';

export function useResumeTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => staffTicketService.resume(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
