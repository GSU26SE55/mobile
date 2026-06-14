import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '../../../lib/queryKeys';
import { StaffAddCommentPayload } from '../types/staff.types';
import { staffTicketService } from '../services/staffTicket.service';
import { handleErrorApi } from '../../../lib/errors';

export function useStaffAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffAddCommentPayload) => staffTicketService.addComment(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
