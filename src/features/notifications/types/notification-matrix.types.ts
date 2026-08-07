// Ma trận tuỳ chọn thông báo theo nhóm × kênh (Sprint 6.3 NOTI3-04).
// Shape khớp BE `NotificationPreferenceMatrixDto.cs` và web `notification-matrix.types.ts`.
import { NotificationCategoryEnum } from '../enums/notification.enum';
import { NotificationPreferenceDto } from './notification-preference.types';

/**
 * Một dòng nhóm trong ma trận.
 *
 * `isCustomized = false` ⇒ 4 giá trị kênh là **kế thừa** từ công tắc toàn cục (`channels`),
 * user chưa đặt tường minh cho nhóm này. UI phải phân biệt được "kế thừa" và "đã đặt",
 * nếu không người dùng tưởng mình đã tuỳ chỉnh trong khi thực tế chưa có record nào.
 */
export interface NotificationCategoryPreferenceDto {
  category: NotificationCategoryEnum;
  categoryName: string; // "Ticket" | "Sla" | ... — BE trả sẵn, khỏi cần bảng tra ở client
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  isCustomized: boolean;
}

/** GET /api/notification-preferences/matrix — `categories` LUÔN đủ 6 phần tử, sort theo enum 1→6. */
export interface NotificationPreferenceMatrixDto {
  channels: NotificationPreferenceDto; // công tắc toàn cục — vẫn THẮNG mọi dòng nhóm
  categories: NotificationCategoryPreferenceDto[];
}

/**
 * PUT /api/notification-preferences/matrix — **vá từng dòng**: chỉ nhóm có trong `items` bị đổi.
 *
 * ⚠️ Nhưng mỗi dòng phải gửi **đủ 4 kênh**: "vá" là theo NHÓM, không phải theo từng ô kênh.
 * Bỏ trống `emailEnabled` thì BE ghi `false` chứ không giữ giá trị cũ.
 */
export interface NotificationCategoryPreferenceItem {
  category: NotificationCategoryEnum;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
}

export interface UpdateNotificationMatrixPayload {
  items: NotificationCategoryPreferenceItem[];
}

/**
 * GET /api/notification-preferences/categories — bảng tra cứu type → nhóm.
 * Số phần tử do BE quyết định, **không hardcode** ở client.
 */
export interface NotificationCategoryMapDto {
  type: string;
  typeValue: number;
  category: string;
  categoryValue: number;
}
