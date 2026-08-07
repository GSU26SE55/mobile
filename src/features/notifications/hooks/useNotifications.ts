import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '../../../lib/queryKeys';
import { handleErrorApi } from '../../../lib/errors';
import { notificationService } from '../services/notification.service';
import { NotificationListParams } from '../types/notification.types';

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: QUERY_KEY.notifications.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await notificationService.getList(params);
      return res.data.data;
    },
  });
}

// Badge số chưa đọc — auto refetch 30s.
// `enabled` cho NotificationBootstrap (mount toàn cục, kể cả màn login) tắt query khi chưa
// đăng nhập — không thì poll 30s/lần vào endpoint 401 và kéo theo refresh-token vô ích.
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY.notifications.unreadCount(),
    queryFn: async () => {
      const res = await notificationService.getUnreadCount();
      return res.data.data ?? 0;
    },
    enabled,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.notifications });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.notifications });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useMarkNotificationOpened() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markOpened(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.notifications });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
