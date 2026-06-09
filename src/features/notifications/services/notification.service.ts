import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import { NotificationDTO, NotificationListParams } from '../types/notification.types';

const { NOTIFICATIONS } = ENDPOINTS;

export const notificationService = {
  getList: (params?: NotificationListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationDTO>>>(NOTIFICATIONS.LIST, { params }),

  markRead: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(NOTIFICATIONS.READ(id)),

  markAllRead: () =>
    axiosInstance.patch<CommonResponse<null>>(NOTIFICATIONS.READ_ALL),
};
