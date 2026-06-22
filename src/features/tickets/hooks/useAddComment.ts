import { useMutation } from '@tanstack/react-query';
import { ticketService } from '../services/ticket.service';
import { AttachmentForm } from '../schemas/comment.schema';

interface AddCommentParams {
  body: string;
  attachments?: AttachmentForm[];
}

// GH-44: KHÔNG invalidate ở đây. Danh sách comment cập nhật qua realtime (setQueryData prepend);
// màn hình tự fallback refetch khi hub mất kết nối. Tránh double refetch khi connected.
export function useAddComment(ticketId: string) {
  return useMutation({
    mutationFn: ({ body, attachments }: AddCommentParams) =>
      ticketService.addComment(ticketId, { body, isInternal: false, attachments }),
  });
}
