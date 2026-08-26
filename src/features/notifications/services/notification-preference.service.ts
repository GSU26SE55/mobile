import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import {
  NotificationPreferenceDto,
  UpdateNotificationPreferencePayload,
} from '../types/notification-preference.types';

const { NOTIFICATION_PREFERENCES } = ENDPOINTS;

export const notificationPreferenceService = {
  // GH-83 — removed `get()`: the settings screen now reads from `GET /matrix` (already includes `channels`).
  // Keeping it would only create a second source for the same data, and no one calls it anymore.

  // PUT — upsert; server gets userId from the JWT (not sent in the body).
  update: (payload: UpdateNotificationPreferencePayload) =>
    axiosInstance.put<CommonResponse<NotificationPreferenceDto>>(
      NOTIFICATION_PREFERENCES.BASE,
      payload,
    ),
};
