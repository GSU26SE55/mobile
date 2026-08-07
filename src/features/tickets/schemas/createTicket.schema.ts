import { z } from 'zod';
import { TicketCategoryEnum } from '@/src/shared/enums/ticket.enum';

// Khớp BE TicketCreateCommand.ValidateAsync (POST /api/customer/tickets).
// GH-866: batteryAssetIds là MẢNG bắt buộc (≥1, distinct); incidentDetectedAt là
// MỘT mốc thời gian bắt buộc, không được ở tương lai.
//
// Giới hạn độ dài lấy từ DB (TicketConfiguration.cs), KHÔNG phải từ ValidateAsync —
// BE chỉ check rỗng, nên vượt giới hạn cột sẽ nổ ở tầng DB chứ không trả 400 đẹp:
//   Title       → HasMaxLength(256)
//   Description → IsRequired(), KHÔNG giới hạn (text) — 500 là giới hạn UI tự đặt.
export const createTicketSchema = z.object({
  title:       z.string().trim().min(1, 'Không được để trống').max(256, 'Tối đa 256 ký tự'),
  description: z
    .string()
    .trim()
    .min(5, 'Tối thiểu 5 ký tự')
    .max(500, 'Tối đa 500 ký tự'),
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
