import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { notificationPreferenceService } from '../services/notification-preference.service';
import { NotificationPreferenceMatrixDto } from '../types/notification-matrix.types';
import { UpdateNotificationPreferencePayload } from '../types/notification-preference.types';

/**
 * Writes the global channel toggle — `PUT /api/notification-preferences`.
 *
 * GH-83: this hook now **only holds the mutation**. The previous version also wrapped a `useQuery` reading
 * `GET /api/notification-preferences`; after the settings screen switched to reading `GET /matrix`
 * (which returns both `channels` and `categories`), that query was no longer read by anyone but **still fired
 * a request** on every mount, since calling the hook alone runs `useQuery` → the screen cost 2 requests instead of 1.
 *
 * Writes still have to go through this endpoint: `PUT /matrix` only accepts `items` (category rows), it doesn't touch `channels`.
 */
export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationPreferencePayload) =>
      notificationPreferenceService.update(payload),
    onSuccess: (res) => {
      const dto = res.data.data;
      if (!dto) return;

      // PUT returns the full DTO → patch the `channels` branch of the matrix cache directly, skipping a refetch.
      // Without patching, the UI would show the old value until the cache expires, even though BE saved it correctly.
      queryClient.setQueryData<NotificationPreferenceMatrixDto>(
        QUERY_KEY.notificationPreferences.matrix(),
        (prev) => (prev ? { ...prev, channels: dto } : prev),
      );
    },
  });
}
