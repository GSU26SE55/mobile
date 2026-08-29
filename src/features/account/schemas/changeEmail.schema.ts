import { z } from 'zod';
import { emailField, otpField } from '@/src/shared/schemas/common.schema';

export const changeEmailSchema = z.object({
  newEmail: emailField,
  currentPassword: z.string().min(1, 'Password must not be empty'),
});

export const confirmEmailOtpSchema = z.object({
  otp: otpField,
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ConfirmEmailOtpInput = z.infer<typeof confirmEmailOtpSchema>;
