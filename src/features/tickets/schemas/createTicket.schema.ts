import { z } from 'zod';

export const createTicketSchema = z.object({
  title:          z.string().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự'),
  description:    z.string().min(1, 'Không được để trống').max(2000, 'Tối đa 2000 ký tự'),
  category:       z.enum(['Charging', 'Overheat', 'NoPower', 'Performance', 'Repair', 'Other']),
  batteryAssetId: z.string().uuid().optional(),
});

export type CreateTicketForm = z.infer<typeof createTicketSchema>;
