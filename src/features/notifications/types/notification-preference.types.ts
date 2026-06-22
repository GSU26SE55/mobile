// Notification preferences — field name + format khớp BE DTO
// (backend/services/NotificationService/.../Preference/NotificationPreferenceDto.cs).
// GET trả default nếu chưa cấu hình (không ghi DB); PUT upsert (chưa có record → tạo mới).

export interface NotificationPreferenceDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart: string | null; // "HH:mm" | null
  quietHoursEnd: string | null; // "HH:mm" | null
  timeZone: string; // IANA, default "Asia/Ho_Chi_Minh"
}

// Body PUT — KHÔNG gửi userId (server set từ JWT, BE [JsonIgnore]).
// Shape trùng DTO; alias riêng cho rõ intent.
export type UpdateNotificationPreferencePayload = NotificationPreferenceDto;
