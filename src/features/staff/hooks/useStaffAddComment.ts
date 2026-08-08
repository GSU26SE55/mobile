import { useMutation } from '@tanstack/react-query';
import { StaffAddCommentPayload } from '../types/staff.types';
import { staffTicketService } from '../services/staffTicket.service';
import { handleErrorApi } from '@/src/lib/errors';

// GH-44: do NOT invalidate here. The comment list (KEY.tickets.chats) updates via realtime;
// the screen falls back to a refetch if the hub disconnects. Avoids a redundant detail refetch.
export function useStaffAddComment(ticketId: string) {
  return useMutation({
    mutationFn: (data: StaffAddCommentPayload) => staffTicketService.addComment(ticketId, data),
    onError: (error) => handleErrorApi({ error }),
  });
}
