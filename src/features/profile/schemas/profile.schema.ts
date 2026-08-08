import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName:    z.string().min(1, 'Full name is required').max(150, 'Maximum 150 characters'),
  phoneNumber: z.string().max(20, 'Maximum 20 characters').optional().or(z.literal('')),
  address:     z.string().max(500, 'Maximum 500 characters').optional().or(z.literal('')),
  birthDate:   z.string().optional(),
  timeZone:    z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
