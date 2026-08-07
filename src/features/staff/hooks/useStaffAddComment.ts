import { useMutation } from '@tanstack/react-query';
import { StaffAddCommentPayload } from '../types/staff.types';
import { staffTicketService } from '../services/staffTicket.service';
import { handleErrorApi } from '@/src/lib/errors';

// GH-44: KHÔNG invalidate ở đây. Comment list (KEY.tickets.chats) cập nhật qua realtime;
// màn hình tự fallback refetch khi hub mất kết nối. Tránh refetch detail thừa.
export function useStaffAddComment(ticketId: string) {
  return useMutation({
    mutationFn: (data: StaffAddCommentPayload) => staffTicketService.addComment(ticketId, data),
    onError: (error) => handleErrorApi({ error }),
  });
}
