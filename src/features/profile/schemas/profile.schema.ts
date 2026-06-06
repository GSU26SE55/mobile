import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName:    z.string().min(1, 'Họ tên không được để trống').max(150, 'Tối đa 150 ký tự'),
  phoneNumber: z.string().max(20, 'Tối đa 20 ký tự').optional().or(z.literal('')),
  address:     z.string().max(500, 'Tối đa 500 ký tự').optional().or(z.literal('')),
  birthDate:   z.string().optional(),
  timeZone:    z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
