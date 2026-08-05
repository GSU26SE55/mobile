import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName:    z.string().min(1, 'Họ tên không được để trống').max(150, 'Tối đa 150 ký tự'),
    email:       z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
    password:    z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .max(100, 'Tối đa 100 ký tự')
      .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
      .regex(/[a-z]/, 'Cần ít nhất 1 chữ thường')
      .regex(/[0-9]/, 'Cần ít nhất 1 chữ số')
      // Khớp BE PasswordPolicy: ký tự đặc biệt = bất kỳ ký tự không phải chữ-số-khoảng trắng (không chỉ !@#$%^&*).
      .regex(/[^A-Za-z0-9\s]/, 'Cần ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
