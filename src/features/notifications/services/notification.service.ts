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
  // Defaults to only the InApp channel. BE writes 1 record per channel (InApp + Push) for each
  // event ⇒ without filtering, the list would show 2 duplicate rows (the Push record is only for
  // sending Expo push, it doesn't belong in the in-app list). Callers can still override the channel if needed.
  getList: (params?: NotificationListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationDTO>>>(NOTIFICATIONS.LIST, {
      params: { channel: NotificationChannelEnum.InApp, ...params },
    }),

  // Empty-body PATCH — data = id of the notification just marked (idempotent).
  markRead: (id: string) =>
    axiosInstance.patch<CommonResponse<string>>(NOTIFICATIONS.MARK_READ(id)),

  // Empty-body PATCH — GH-83. Used when the user ACTIVELY opens the content (taps push, or taps a row with
  // a deep-link). A plain tap in the feed is still just markRead — split into 2 branches so open-rate isn't diluted.
  // Idempotent: still returns 200 if called again due to a flaky network.
  markOpened: (id: string) =>
    axiosInstance.patch<CommonResponse<string>>(NOTIFICATIONS.MARK_OPENED(id)),

  // Empty-body POST — data = number of notifications marked.
  markAllRead: () =>
    axiosInstance.post<CommonResponse<number>>(NOTIFICATIONS.MARK_ALL_READ),

  // GET — data = number of unread notifications (badge).
  getUnreadCount: () =>
    axiosInstance.get<CommonResponse<number>>(NOTIFICATIONS.UNREAD_COUNT),
};
