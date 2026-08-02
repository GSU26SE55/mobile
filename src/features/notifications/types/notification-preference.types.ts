// Notification preferences — field name + format khớp BE DTO
// (backend/services/NotificationService/.../Preference/NotificationPreferenceDto.cs).
// GET trả default nếu chưa cấu hình (không ghi DB); PUT upsert (chưa có record → tạo mới).

/**
 * ⚠️ GH-83 — PHẢI đủ 11 field, không được rút gọn.
 *
 * `UpdateNotificationPreferenceCommand` bên BE dùng property initializer C#
 * (`NotifyOnChat = true`, `NotifyOnMention = true`, `NotifyOnReaction = false`,
 * `DigestWindowMinutes = null`). Đây là **PUT chứ không phải PATCH**: field nào không có trong JSON
 * sẽ nhận giá trị khởi tạo rồi bị ghi xuống DB — **không** giữ giá trị cũ.
 *
 * Bản trước chỉ khai 7 field nên mỗi lần bấm Lưu trên mobile là reset 4 field còn lại: user tắt
 * thông báo chat trên web xong mở app bấm Lưu là nó tự bật lại. Field nào chưa làm UI thì vẫn phải
 * fetch rồi gửi lại nguyên giá trị (pass-through).
 */
export interface NotificationPreferenceDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart: string | null; // "HH:mm" | null
  quietHoursEnd: string | null; // "HH:mm" | null
  timeZone: string; // IANA, default "Asia/Ho_Chi_Minh"
  notifyOnChat: boolean;
  notifyOnMention: boolean;
  notifyOnReaction: boolean;
  digestWindowMinutes: number | null; // pass-through — mobile chưa có UI Frequency
}

// Body PUT — KHÔNG gửi userId (server set từ JWT, BE [JsonIgnore]).
// Shape trùng DTO; alias riêng cho rõ intent.
export type UpdateNotificationPreferencePayload = NotificationPreferenceDto;
