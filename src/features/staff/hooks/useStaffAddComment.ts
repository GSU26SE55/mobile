import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '../../../lib/queryKeys';
import { AddCommentPayload } from '../../tickets/types/ticket.types';
import { staffTicketService } from '../services/staffTicket.service';

export function useStaffAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCommentPayload) => staffTicketService.addComment(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
    },
  });
}
