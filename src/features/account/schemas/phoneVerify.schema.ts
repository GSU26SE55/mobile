import { z } from 'zod';

export const phoneOtpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain digits only'),
});

export type PhoneOtpInput = z.infer<typeof phoneOtpSchema>;
