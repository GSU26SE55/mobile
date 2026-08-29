import { z } from 'zod';
import { emailField, fullNameField, passwordField } from '@/src/shared/schemas/common.schema';

export const registerSchema = z
  .object({
    fullName:    fullNameField,
    email:       emailField,
    password:    passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password confirmation does not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
