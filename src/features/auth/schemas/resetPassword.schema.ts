import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .max(100, 'Tối đa 100 ký tự')
      .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
      .regex(/[a-z]/, 'Cần ít nhất 1 chữ thường')
      .regex(/[0-9]/, 'Cần ít nhất 1 chữ số')
      // Khớp BE PasswordPolicy: ký tự đặc biệt = bất kỳ ký tự không phải chữ-số-khoảng trắng.
      .regex(/[^A-Za-z0-9\s]/, 'Cần ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
