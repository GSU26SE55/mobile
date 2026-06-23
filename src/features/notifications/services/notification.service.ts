import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import { NotificationDTO, NotificationListParams } from '../types/notification.types';

const { NOTIFICATIONS } = ENDPOINTS;

export const notificationService = {
  getList: (params?: NotificationListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationDTO>>>(NOTIFICATIONS.LIST, { params }),

  // PATCH body rỗng — data = id notification vừa mark (idempotent).
  markRead: (id: string) =>
    axiosInstance.patch<CommonResponse<string>>(NOTIFICATIONS.MARK_READ(id)),

  // POST body rỗng — data = số notification đã mark.
  markAllRead: () =>
    axiosInstance.post<CommonResponse<number>>(NOTIFICATIONS.MARK_ALL_READ),

  // GET — data = số notification chưa đọc (badge).
  getUnreadCount: () =>
    axiosInstance.get<CommonResponse<number>>(NOTIFICATIONS.UNREAD_COUNT),
};
