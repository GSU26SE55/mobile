import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import {
  NotificationCategoryMapDto,
  NotificationPreferenceMatrixDto,
  UpdateNotificationMatrixPayload,
} from '../types/notification-matrix.types';

const { NOTIFICATION_PREFERENCES } = ENDPOINTS;

export const notificationMatrixService = {
  // GET — always returns all 6 categories; a category not yet customized has isCustomized = false (inherited value).
  // Also includes `channels`, so the settings screen only needs this one request, no more calling GET base.
  getMatrix: () =>
    axiosInstance.get<CommonResponse<NotificationPreferenceMatrixDto>>(
      NOTIFICATION_PREFERENCES.MATRIX,
    ),

  // PUT — patches per row: only the category present in items is changed, the rest stay as-is.
  // Response returns the FULL matrix after the update ⇒ write straight to the cache, skip refetch.
  updateMatrix: (payload: UpdateNotificationMatrixPayload) =>
    axiosInstance.put<CommonResponse<NotificationPreferenceMatrixDto>>(
      NOTIFICATION_PREFERENCES.MATRIX,
      payload,
    ),

  // GET — NotificationType → category lookup table. Element count is decided by BE.
  getCategories: () =>
    axiosInstance.get<CommonResponse<NotificationCategoryMapDto[]>>(
      NOTIFICATION_PREFERENCES.CATEGORIES,
    ),
};
