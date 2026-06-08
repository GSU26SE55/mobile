import { z } from 'zod';

const attachmentSchema = z.object({
  fileId:      z.string(),
  fileName:    z.string(),
  contentType: z.string(),
  sizeBytes:   z.number(),
});

export const commentSchema = z.object({
  body:        z.string().min(1, 'Không được để trống').max(1000, 'Tối đa 1000 ký tự'),
  attachments: z.array(attachmentSchema).optional(),
});

export type CommentForm = z.infer<typeof commentSchema>;
export type AttachmentForm = z.infer<typeof attachmentSchema>;
