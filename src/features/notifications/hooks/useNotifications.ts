import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '@/src/lib/queryKeys';
import { handleErrorApi } from '@/src/lib/errors';
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

const FEED_PAGE_SIZE = 20;

/**
 * Infinite-scroll feed. Previously the feed only loaded the default first page (10 rows) with no way to
 * see more — older notifications were effectively invisible to the user.
 *
 * BE already returns `hasNextPage` + `pageNumber` in `PaginationResponse`, so there's no need to derive them.
 */
export function useInfiniteNotifications(params?: NotificationListParams) {
  return useInfiniteQuery({
    queryKey: QUERY_KEY.notifications.infinite(params as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await notificationService.getList({
        pageSize: FEED_PAGE_SIZE,
        ...params,
        pageNumber: pageParam,
      });
      return res.data.data;
    },
    getNextPageParam: (last) => (last?.hasNextPage ? last.pageNumber + 1 : undefined),
  });
}

/**
 * Unread count badge.
 *
 * NO polling: `useNotificationsRealtime` (hub `/hubs/notifications`) listens for "UnreadCountChanged"
 * and writes the number BE sends straight into this cache key. Keeping a `refetchInterval` on top would fire
 * the exact request realtime just replaced — the BE docs also state polling isn't needed once the hub is connected.
 *
 * This query still fetches once on mount (badge shows a number as soon as the app opens, before the hub
 * can emit an event) and gets invalidated on reconnect / returning to foreground — the moments realtime
 * may have missed an event.
 *
 * `enabled` lets NotificationBootstrap (mounted globally, including the login screen) disable the query while
 * not logged in — otherwise it would hit the endpoint, get a 401, and trigger a pointless refresh-token attempt.
 */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY.notifications.unreadCount(),
    queryFn: async () => {
      const res = await notificationService.getUnreadCount();
      return res.data.data ?? 0;
    },
    enabled,
    staleTime: 0,
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

/**
 * GH-83 — marks that the user ACTIVELY opened the notification (tapped push / opened via deep-link).
 *
 * BE auto-sets `ReadAt` when transitioning to `Opened`, so there's NO need to also call `markRead`.
 * The error is swallowed intentionally: this is telemetry — a failure must not block the user's navigation.
 */
export function useMarkNotificationOpened() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markOpened(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.notifications });
    },
    onError: () => {
      // No toast: the user is already navigating away, an "opened" mark failure error would just be noise.
    },
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
