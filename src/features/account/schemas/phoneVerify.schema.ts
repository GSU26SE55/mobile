import { z } from 'zod';
import { otpField } from '@/src/shared/schemas/common.schema';

export const phoneOtpSchema = z.object({
  otp: otpField,
});

export type PhoneOtpInput = z.infer<typeof phoneOtpSchema>;
