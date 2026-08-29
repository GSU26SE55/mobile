import { z } from 'zod';
import { emailField, otpField } from '@/src/shared/schemas/common.schema';

// #AUTH-50: step 1 — enter the deleted account's email to receive a recovery OTP.
export const reactivateRequestSchema = z.object({
  email: emailField,
});

export type ReactivateRequestInput = z.infer<typeof reactivateRequestSchema>;

// #AUTH-50: step 2 — enter the OTP received via email to reactivate.
export const reactivateVerifySchema = z.object({
  email: emailField,
  otp: otpField,
});

export type ReactivateVerifyInput = z.infer<typeof reactivateVerifySchema>;
