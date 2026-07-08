// GH-56 — Zod schemas. Parse thủ công bằng safeParse() (mobile không dùng React Hook Form).
import { z } from 'zod';

// deviceCode (mã in trên thiết bị). BE Trim().ToUpperInvariant() rồi match unique index (L3)
// → client cũng trim + uppercase để hiển thị/gửi nhất quán. Regex bỏ cờ `i` vì value đã uppercase.
export const deviceCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, 'deviceCode tối thiểu 3 ký tự')
  .max(64, 'deviceCode tối đa 64 ký tự')
  .regex(/^[A-Z0-9-]+$/, 'Chỉ gồm chữ in hoa, số và dấu gạch ngang');

// createCalibrationSchema — field-level rules. Cross-field (expiresAt > calibratedAt) ở superRefine.
export const createCalibrationSchema = z
  .object({
    channel: z.string().trim().toLowerCase().min(1, 'Bắt buộc').max(32, 'Tối đa 32 ký tự'),
    unit: z.string().trim().min(1, 'Bắt buộc').max(16, 'Tối đa 16 ký tự'),
    scale: z.number().refine((v) => v !== 0, 'scale phải khác 0'), // doc: "khác 0"
    offset: z.number(),
    calibratedAt: z.string().min(1, 'Bắt buộc'), // ISO UTC — N2: KHÔNG chặn tương lai (đúng contract)
    expiresAt: z.string().optional(),
    batteryAssetId: z.string().uuid('batteryAssetId không hợp lệ').optional().nullable(),
    notes: z.string().max(500, 'Tối đa 500 ký tự').optional(),
  })
  // N1: cross-field — field-level Zod không so 2 field được, phải đặt ở cấp object.
  .refine((v) => !v.expiresAt || new Date(v.expiresAt) > new Date(v.calibratedAt), {
    message: 'expiresAt phải sau calibratedAt',
    path: ['expiresAt'],
  });

export type CreateCalibrationInput = z.infer<typeof createCalibrationSchema>;
