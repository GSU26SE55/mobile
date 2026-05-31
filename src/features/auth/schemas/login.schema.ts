import { z } from 'zod';

export const loginSchema = z.object({
  email:    z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export type LoginInput = z.infer<typeof loginSchema>;
