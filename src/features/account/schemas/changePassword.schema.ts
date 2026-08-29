import { z } from 'zod';
import { passwordField } from '@/src/shared/schemas/common.schema';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password must not be empty'),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .superRefine(({ currentPassword, newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password confirmation does not match',
        path: ['confirmPassword'],
      });
    }

    // ChangePasswordCommand rejects this with a 422 — without the rule the user only
    // finds out after submitting, having typed the same password three times.
    if (currentPassword && newPassword && currentPassword === newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New password must be different from the current password',
        path: ['newPassword'],
      });
    }
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
