import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '../../../lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { ResolvePayload } from '../types/staff.types';

export function useResolveTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ResolvePayload) => staffTicketService.resolve(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
    },
  });
}
