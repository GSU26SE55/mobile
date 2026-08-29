import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { handleErrorApi } from '@/src/lib/errors';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { notificationMatrixService } from '../services/notification-matrix.service';
import {
  NotificationPreferenceMatrixDto,
  UpdateNotificationMatrixPayload,
} from '../types/notification-matrix.types';

/**
 * Category × channel matrix + global toggle — the ONE source for the notification settings screen.
 *
 * `GET /matrix` returns both `channels` and `categories` so it's not called alongside `GET /notification-preferences`.
 * Two sources for the same data is a guaranteed way for them to drift apart.
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
      // PUT returns the full matrix after the update → write straight to the cache, avoiding an extra refetch.
      const dto = res.data.data;
      if (dto) {
        queryClient.setQueryData<NotificationPreferenceMatrixDto>(
          QUERY_KEY.notificationPreferences.matrix(),
          dto,
        );
      }
    },
    // Không có onError thì mutation hỏng là im lặng — user bấm nút, không thấy gì,
    // tưởng nút hỏng. handleErrorApi hiện Alert.
    onError: (error: unknown) => handleErrorApi({ error }),
  });

  return { matrix, updateMatrix };
}

/**
 * Type → category lookup table, used to answer "what notifications would I lose by disabling this category".
 *
 * Nearly static (only changes when BE adds a NotificationType) so it's cached long. Do NOT duplicate this
 * table as a client-side constant — adding a new type would go stale immediately, which is exactly why BE
 * exposes a dedicated endpoint.
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
