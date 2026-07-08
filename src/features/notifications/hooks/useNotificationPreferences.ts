import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { notificationPreferenceService } from '../services/notification-preference.service';
import {
  NotificationPreferenceDto,
  UpdateNotificationPreferencePayload,
} from '../types/notification-preference.types';

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const pref = useQuery({
    queryKey: QUERY_KEY.notificationPreferences.detail(),
    queryFn: async () => {
      const res = await notificationPreferenceService.get();
      return res.data.data;
    },
    staleTime: 5 * 60_000, // 5 phút
  });

  const updatePref = useMutation({
    mutationFn: (payload: UpdateNotificationPreferencePayload) =>
      notificationPreferenceService.update(payload),
    onSuccess: (res) => {
      // PUT trả full DTO → ghi đè cache, tránh refetch thừa.
      const dto = res.data.data;
      if (dto) {
        queryClient.setQueryData<NotificationPreferenceDto>(
          QUERY_KEY.notificationPreferences.detail(),
          dto,
        );
      }
    },
  });

  return { pref, updatePref };
}
