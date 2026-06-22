import { z } from 'zod';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/; // 00:00–23:59

export const notificationPreferenceSchema = z
  .object({
    pushEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    smsEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
    quietHoursStart: z.string().regex(HHMM, 'Định dạng phải là HH:mm').nullable(),
    quietHoursEnd: z.string().regex(HHMM, 'Định dạng phải là HH:mm').nullable(),
    timeZone: z
      .string()
      .min(1, 'TimeZone không được trống')
      .max(100, 'TimeZone tối đa 100 ký tự'),
  })
  // BE KHÔNG ép cặp (gửi 1 null 1 có vẫn nhận) → FE tự giữ invariant.
  // KHÔNG validate start < end — wrap-around qua đêm (22:00–07:00) là hợp lệ.
  .refine((v) => (v.quietHoursStart == null) === (v.quietHoursEnd == null), {
    message: 'Phải nhập cả giờ bắt đầu và kết thúc, hoặc tắt giờ im lặng',
    path: ['quietHoursEnd'],
  });

export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
