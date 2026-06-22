import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  NotificationPreferenceDto,
  UpdateNotificationPreferencePayload,
} from '../types/notification-preference.types';

const { NOTIFICATION_PREFERENCES } = ENDPOINTS;

export const notificationPreferenceService = {
  // GET — chưa cấu hình → BE trả default (không ghi DB).
  get: () =>
    axiosInstance.get<CommonResponse<NotificationPreferenceDto>>(NOTIFICATION_PREFERENCES.BASE),

  // PUT — upsert; userId server lấy từ JWT (không gửi trong body).
  update: (payload: UpdateNotificationPreferencePayload) =>
    axiosInstance.put<CommonResponse<NotificationPreferenceDto>>(
      NOTIFICATION_PREFERENCES.BASE,
      payload,
    ),
};
