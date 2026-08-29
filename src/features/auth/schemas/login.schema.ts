import { z } from 'zod';
import { emailField } from '@/src/shared/schemas/common.schema';

export const loginSchema = z.object({
  email:    emailField,
  // Login only checks presence — strength is enforced when the password is set.
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
