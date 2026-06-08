import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { ticketService } from '../services/ticket.service';
import { AttachmentForm } from '../schemas/comment.schema';

interface AddCommentParams {
  body: string;
  attachments?: AttachmentForm[];
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, attachments }: AddCommentParams) =>
      ticketService.addComment(ticketId, { body, isInternal: false, attachments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.detail(ticketId) });
    },
  });
}
