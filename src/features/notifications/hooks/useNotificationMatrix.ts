import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { notificationMatrixService } from '../services/notification-matrix.service';
import {
  NotificationPreferenceMatrixDto,
  UpdateNotificationMatrixPayload,
} from '../types/notification-matrix.types';

/**
 * Ma trận nhóm × kênh + công tắc toàn cục — nguồn DUY NHẤT cho màn cài đặt thông báo.
 *
 * `GET /matrix` trả cả `channels` lẫn `categories` nên không gọi kèm `GET /notification-preferences`.
 * Hai nguồn cho cùng một dữ liệu là cách chắc chắn để chúng lệch nhau.
 */
export function useNotificationMatrix() {
  const queryClient = useQueryClient();

  const matrix = useQuery({
    queryKey: QUERY_KEY.notificationPreferences.matrix(),
    queryFn: async () => {
      const res = await notificationMatrixService.getMatrix();
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });

  const updateMatrix = useMutation({
    mutationFn: (payload: UpdateNotificationMatrixPayload) =>
      notificationMatrixService.updateMatrix(payload),
    onSuccess: (res) => {
      // PUT trả ma trận đầy đủ sau cập nhật → ghi thẳng cache, tránh refetch thừa.
      const dto = res.data.data;
      if (dto) {
        queryClient.setQueryData<NotificationPreferenceMatrixDto>(
          QUERY_KEY.notificationPreferences.matrix(),
          dto,
        );
      }
    },
  });

  return { matrix, updateMatrix };
}

/**
 * Bảng tra cứu type → nhóm, phục vụ câu "tắt nhóm này thì mất những thông báo nào".
 *
 * Gần như tĩnh (chỉ đổi khi BE thêm NotificationType) nên cache dài. KHÔNG nhân bản bảng này thành
 * hằng số ở client — thêm type mới là lệch ngay, đó là lý do BE mở hẳn endpoint.
 */
export function useNotificationCategoryMap() {
  return useQuery({
    queryKey: QUERY_KEY.notificationPreferences.categories(),
    queryFn: async () => {
      const res = await notificationMatrixService.getCategories();
      return res.data.data ?? [];
    },
    staleTime: 30 * 60_000,
  });
}
