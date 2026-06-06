import { z } from 'zod';

export const changeEmailSchema = z.object({
  newEmail: z
    .string()
    .min(1, 'Email không được để trống')
    .max(256, 'Tối đa 256 ký tự')
    .email('Email không đúng định dạng'),
  currentPassword: z.string().min(1, 'Mật khẩu không được để trống'),
});

export const confirmEmailOtpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP phải đúng 6 chữ số')
    .regex(/^\d{6}$/, 'OTP chỉ gồm chữ số'),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ConfirmEmailOtpInput = z.infer<typeof confirmEmailOtpSchema>;
