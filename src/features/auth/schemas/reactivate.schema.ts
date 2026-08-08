import { z } from 'zod';

// #AUTH-50: step 1 — enter the deleted account's email to receive a recovery OTP.
export const reactivateRequestSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
});

export type ReactivateRequestInput = z.infer<typeof reactivateRequestSchema>;

// #AUTH-50: step 2 — enter the OTP received via email to reactivate.
export const reactivateVerifySchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export type ReactivateVerifyInput = z.infer<typeof reactivateVerifySchema>;
