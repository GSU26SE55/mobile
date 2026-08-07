import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import {
  NotificationPreferenceDto,
  UpdateNotificationPreferencePayload,
} from '../types/notification-preference.types';

const { NOTIFICATION_PREFERENCES } = ENDPOINTS;

export const notificationPreferenceService = {
  // GH-83 — bỏ `get()`: màn cài đặt đọc từ `GET /matrix` (đã bao gồm `channels`).
  // Giữ lại chỉ tạo nguồn thứ hai cho cùng dữ liệu, và không ai gọi nữa.

  // PUT — upsert; userId server lấy từ JWT (không gửi trong body).
  update: (payload: UpdateNotificationPreferencePayload) =>
    axiosInstance.put<CommonResponse<NotificationPreferenceDto>>(
      NOTIFICATION_PREFERENCES.BASE,
      payload,
    ),
};
