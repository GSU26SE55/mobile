import { z } from 'zod';

export const changeEmailSchema = z.object({
  newEmail: z
    .string()
    .min(1, 'Email must not be empty')
    .max(256, 'Maximum 256 characters')
    .email('Invalid email format'),
  currentPassword: z.string().min(1, 'Password must not be empty'),
});

export const confirmEmailOtpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain digits only'),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ConfirmEmailOtpInput = z.infer<typeof confirmEmailOtpSchema>;
