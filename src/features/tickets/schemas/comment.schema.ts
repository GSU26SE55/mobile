import { z } from 'zod';

const attachmentSchema = z.object({
  fileId:      z.string(),
  fileName:    z.string(),
  contentType: z.string(),
  sizeBytes:   z.number(),
});

export const commentSchema = z.object({
  body:        z.string().min(1, 'Cannot be empty').max(1000, 'Maximum 1000 characters'),
  attachments: z.array(attachmentSchema).optional(),
});

export type CommentForm = z.infer<typeof commentSchema>;
export type AttachmentForm = z.infer<typeof attachmentSchema>;
