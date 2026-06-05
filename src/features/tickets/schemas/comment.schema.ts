import { z } from 'zod';

export const commentSchema = z.object({
  body: z.string().min(1, 'Không được để trống').max(1000, 'Tối đa 1000 ký tự'),
});

export type CommentForm = z.infer<typeof commentSchema>;
