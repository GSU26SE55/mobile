import { z } from 'zod';
import { otpField } from '@/src/shared/schemas/common.schema';

export const otpSchema = z.object({
  otp: otpField,
});

export type OtpInput = z.infer<typeof otpSchema>;
