import { z } from 'zod';
import { commentBodyField } from '@/src/shared/schemas/common.schema';

// Mirrors BE ChatAddCommand: fileName/contentType are required on every attachment.
const attachmentSchema = z.object({
  fileId:      z.string(),
  fileName:    z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes:   z.number(),
});

export const commentSchema = z.object({
  // The BE allows 10000, not 1000, and rejects whitespace/emoji-only bodies on both the
  // add and edit paths (ChatBodyPolicy).
  body:        commentBodyField.refine((v) => v.length > 0, 'Cannot be empty'),
  attachments: z.array(attachmentSchema).optional(),
});

export type CommentForm = z.infer<typeof commentSchema>;
export type AttachmentForm = z.infer<typeof attachmentSchema>;
