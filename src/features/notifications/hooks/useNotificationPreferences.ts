import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { notificationPreferenceService } from '../services/notification-preference.service';
import { NotificationPreferenceMatrixDto } from '../types/notification-matrix.types';
import { UpdateNotificationPreferencePayload } from '../types/notification-preference.types';

/**
 * Ghi công tắc kênh toàn cục — `PUT /api/notification-preferences`.
 *
 * GH-83: hook này **chỉ còn mutation**. Bản trước bọc kèm một `useQuery` đọc
 * `GET /api/notification-preferences`; sau khi màn cài đặt chuyển sang đọc `GET /matrix`
 * (trả cả `channels` lẫn `categories`), cái query đó không ai đọc nữa nhưng **vẫn bắn request**
 * mỗi lần mount vì chỉ cần gọi hook là `useQuery` chạy → màn hình tốn 2 request thay vì 1.
 *
 * Ghi thì vẫn phải qua endpoint này: `PUT /matrix` chỉ nhận `items` (dòng nhóm), không đụng `channels`.
 */
export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationPreferencePayload) =>
      notificationPreferenceService.update(payload),
    onSuccess: (res) => {
      const dto = res.data.data;
      if (!dto) return;

      // PUT trả full DTO → vá thẳng nhánh `channels` của cache matrix, khỏi refetch.
      // Không vá thì UI hiện giá trị cũ tới khi cache hết hạn, dù BE đã lưu đúng.
      queryClient.setQueryData<NotificationPreferenceMatrixDto>(
        QUERY_KEY.notificationPreferences.matrix(),
        (prev) => (prev ? { ...prev, channels: dto } : prev),
      );
    },
  });
}
