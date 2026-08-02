import { z } from 'zod';
import { TicketCategoryEnum } from '../../../shared/enums/ticket.enum';

// Khớp BE TicketCreateCommand.ValidateAsync (POST /api/customer/tickets).
// GH-866: batteryAssetIds là MẢNG bắt buộc (≥1, distinct); incidentDetectedAt là
// MỘT mốc thời gian bắt buộc, không được ở tương lai.
export const createTicketSchema = z.object({
  title:       z.string().trim().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự'),
  description: z.string().trim().min(1, 'Không được để trống').max(2000, 'Tối đa 2000 ký tự'),
  category:    z.nativeEnum(TicketCategoryEnum),
  batteryAssetIds: z
    .array(z.string().uuid())
    .min(1, 'Phải chọn ít nhất một pin')
    .refine((ids) => new Set(ids).size === ids.length, 'Danh sách pin không được trùng lặp'),
  incidentDetectedAt: z
    .string()
    .datetime()
    .refine((iso) => new Date(iso) <= new Date(), 'Thời điểm phát hiện không được ở tương lai'),
});

export type CreateTicketForm = z.infer<typeof createTicketSchema>;
