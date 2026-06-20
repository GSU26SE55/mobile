import { z } from 'zod';
import { TicketCategoryEnum } from '../../../shared/enums/ticket.enum';

export const createTicketSchema = z.object({
  title:          z.string().trim().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự'),
  description:    z.string().trim().min(1, 'Không được để trống').max(2000, 'Tối đa 2000 ký tự'),
  category:       z.nativeEnum(TicketCategoryEnum),
  batteryAssetId: z.string().uuid().optional(),
});

export type CreateTicketForm = z.infer<typeof createTicketSchema>;
