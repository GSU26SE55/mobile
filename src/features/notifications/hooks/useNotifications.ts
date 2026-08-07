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
 * Feed cuộn vô hạn. Trước đây feed chỉ tải đúng 1 trang mặc định (10 dòng) và không có cách nào
 * xem tiếp — thông báo cũ hơn coi như không tồn tại với người dùng.
 *
 * BE trả `hasNextPage` + `pageNumber` sẵn trong `PaginationResponse` nên không cần tự suy ra.
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
 * Badge số chưa đọc.
 *
 * KHÔNG polling: `useNotificationsRealtime` (hub `/hubs/notifications`) nghe "UnreadCountChanged"
 * và ghi thẳng số BE gửi vào chính cache key này. Giữ thêm `refetchInterval` sẽ bắn lại đúng
 * request mà realtime vừa thay thế — doc BE cũng nói rõ không cần polling khi đã nối hub.
 *
 * Query này vẫn fetch lần đầu (badge có số ngay khi mở app, trước khi hub kịp phát event) và được
 * invalidate khi reconnect / quay lại foreground — đó là các mốc realtime có thể đã lỡ event.
 *
 * `enabled` cho NotificationBootstrap (mount toàn cục, kể cả màn login) tắt query khi chưa
 * đăng nhập — không thì bắn vào endpoint 401 và kéo theo refresh-token vô ích.
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
 * GH-83 — đánh dấu user đã CHỦ ĐỘNG mở notification (bấm push / mở qua deep-link).
 *
 * BE tự set `ReadAt` khi chuyển sang `Opened` nên KHÔNG cần gọi kèm `markRead`.
 * Lỗi được nuốt có chủ đích: đây là telemetry, hỏng thì không được chặn điều hướng của user.
 */
export function useMarkNotificationOpened() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markOpened(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.notifications });
    },
    onError: () => {
      // Không toast: user đang chuyển màn, báo lỗi "không đánh dấu được đã mở" chỉ gây nhiễu.
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
