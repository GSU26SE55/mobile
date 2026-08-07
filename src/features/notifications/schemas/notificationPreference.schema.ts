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
    // GH-83 — BẮT BUỘC khai ở đây, không chỉ ở type. `safeParse` trả về object đã strip mọi key
    // không có trong schema, mà `parsed.data` mới là thứ gửi lên BE → thiếu ở schema thì field vẫn
    // bị rụng và BE ghi đè bằng default, y hệt bug cũ.
    notifyOnChat: z.boolean(),
    notifyOnMention: z.boolean(),
    notifyOnReaction: z.boolean(),
    // Pass-through: mobile chưa có UI Frequency nên không đặt ràng buộc tự nghĩ ra.
    digestWindowMinutes: z.number().int().nullable(),
  })
  // BE KHÔNG ép cặp (gửi 1 null 1 có vẫn nhận) → FE tự giữ invariant.
  // KHÔNG validate start < end — wrap-around qua đêm (22:00–07:00) là hợp lệ.
  .refine((v) => (v.quietHoursStart == null) === (v.quietHoursEnd == null), {
    message: 'Phải nhập cả giờ bắt đầu và kết thúc, hoặc tắt giờ im lặng',
    path: ['quietHoursEnd'],
  });

export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
