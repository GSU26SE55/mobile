import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import {
  NotificationChannelEnum,
  NotificationDTO,
  NotificationListParams,
} from '../types/notification.types';

const { NOTIFICATIONS } = ENDPOINTS;

export const notificationService = {
  // Mặc định chỉ lấy channel InApp. BE ghi 1 record/channel (InApp + Push) cho mỗi
  // sự kiện ⇒ nếu không lọc, list hiện trùng 2 dòng (record Push chỉ để đẩy Expo,
  // không thuộc danh sách in-app). Caller vẫn override channel được nếu cần.
  getList: (params?: NotificationListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationDTO>>>(NOTIFICATIONS.LIST, {
      params: { channel: NotificationChannelEnum.InApp, ...params },
    }),

  // PATCH body rỗng — data = id notification vừa mark (idempotent).
  markRead: (id: string) =>
    axiosInstance.patch<CommonResponse<string>>(NOTIFICATIONS.MARK_READ(id)),

  // PATCH body rỗng — GH-83. Dùng khi user CHỦ ĐỘNG mở nội dung (bấm push, hoặc bấm dòng có
  // deep-link). Bấm thường trong feed vẫn chỉ là markRead — tách 2 nhánh để open-rate không loãng.
  // Idempotent: gọi lại khi mạng chập chờn vẫn 200.
  markOpened: (id: string) =>
    axiosInstance.patch<CommonResponse<string>>(NOTIFICATIONS.MARK_OPENED(id)),

  // POST body rỗng — data = số notification đã mark.
  markAllRead: () =>
    axiosInstance.post<CommonResponse<number>>(NOTIFICATIONS.MARK_ALL_READ),

  // GET — data = số notification chưa đọc (badge).
  getUnreadCount: () =>
    axiosInstance.get<CommonResponse<number>>(NOTIFICATIONS.UNREAD_COUNT),
};
