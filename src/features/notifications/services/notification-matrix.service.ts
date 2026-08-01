import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  NotificationCategoryMapDto,
  NotificationPreferenceMatrixDto,
  UpdateNotificationMatrixPayload,
} from '../types/notification-matrix.types';

const { NOTIFICATION_PREFERENCES } = ENDPOINTS;

export const notificationMatrixService = {
  // GET — luôn trả đủ 6 nhóm; nhóm chưa tuỳ chỉnh có isCustomized = false (giá trị kế thừa).
  // Kèm luôn `channels` nên màn cài đặt chỉ cần 1 request này, không gọi GET base nữa.
  getMatrix: () =>
    axiosInstance.get<CommonResponse<NotificationPreferenceMatrixDto>>(
      NOTIFICATION_PREFERENCES.MATRIX,
    ),

  // PUT — vá từng dòng: chỉ nhóm có trong items bị đổi, nhóm còn lại giữ nguyên.
  // Response trả về ma trận ĐẦY ĐỦ sau khi cập nhật ⇒ ghi thẳng vào cache, khỏi refetch.
  updateMatrix: (payload: UpdateNotificationMatrixPayload) =>
    axiosInstance.put<CommonResponse<NotificationPreferenceMatrixDto>>(
      NOTIFICATION_PREFERENCES.MATRIX,
      payload,
    ),

  // GET — bảng tra cứu NotificationType → nhóm. Số phần tử do BE quyết định.
  getCategories: () =>
    axiosInstance.get<CommonResponse<NotificationCategoryMapDto[]>>(
      NOTIFICATION_PREFERENCES.CATEGORIES,
    ),
};
