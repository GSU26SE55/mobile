import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password must not be empty'),
    newPassword: z
      .string()
      .min(8, 'Minimum 8 characters')
      .max(100, 'Maximum 100 characters')
      .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Must contain at least 1 digit')
      // Matches BE PasswordPolicy: special character = any character that isn't a letter, digit, or whitespace.
      .regex(/[^A-Za-z0-9\s]/, 'Must contain at least 1 special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Password confirmation does not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
