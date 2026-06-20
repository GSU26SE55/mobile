import { z } from 'zod';

// #AUTH-50: bước 1 — nhập email account đã xóa để nhận OTP khôi phục.
export const reactivateRequestSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
});

export type ReactivateRequestInput = z.infer<typeof reactivateRequestSchema>;

// #AUTH-50: bước 2 — nhập OTP nhận qua email để khôi phục.
export const reactivateVerifySchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
  otp: z.string().length(6, 'OTP phải đúng 6 chữ số').regex(/^\d{6}$/, 'OTP chỉ gồm chữ số'),
});

export type ReactivateVerifyInput = z.infer<typeof reactivateVerifySchema>;
