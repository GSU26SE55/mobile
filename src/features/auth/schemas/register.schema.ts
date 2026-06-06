import { z } from 'zod';

export const registerSchema = z.object({
  fullName:    z.string().min(1, 'Họ tên không được để trống').max(150, 'Tối đa 150 ký tự'),
  email:       z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
  password:    z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .max(100, 'Tối đa 100 ký tự')
    .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Cần ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Cần ít nhất 1 chữ số')
    .regex(/[!@#$%^&*]/, 'Cần ít nhất 1 ký tự đặc biệt'),
  phoneNumber: z
    .string()
    .regex(/^(0[35789])[0-9]{8}$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
});

export type RegisterInput = z.infer<typeof registerSchema>;
