import { useMutation } from '@tanstack/react-query';
import { ticketService } from '../services/ticket.service';
import { AttachmentForm } from '../schemas/comment.schema';
import type { ChatMentionInput } from '../types/ticket.types';

interface AddCommentParams {
  body: string;
  /** BE nhận mention qua field này, KHÔNG parse '@' từ body. */
  mentions?: ChatMentionInput[];
  attachments?: AttachmentForm[];
}

// GH-44: KHÔNG invalidate ở đây. Danh sách comment cập nhật qua realtime (setQueryData prepend);
// màn hình tự fallback refetch khi hub mất kết nối. Tránh double refetch khi connected.
export function useAddComment(ticketId: string) {
  return useMutation({
    mutationFn: ({ body, mentions, attachments }: AddCommentParams) =>
      ticketService.addComment(ticketId, { body, isInternal: false, mentions, attachments }),
  });
}
