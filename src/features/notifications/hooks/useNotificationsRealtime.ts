import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import { BASE_URL } from '@/src/lib/axios';
import { getAccessToken } from '@/src/lib/secureStore';
import { KEY, QUERY_KEY } from '@/src/lib/queryKeys';

const HUB_PATH = '/hubs/notifications';

/**
 * SignalR realtime cho feed thông báo in-app — thay polling 30s của `useUnreadCount`.
 *
 * Tên event PHẢI khớp BE (`SignalRNotificationNotifier`):
 *   - "NotificationCreated"  → ghi 1 noti in-app mới
 *   - "NotificationReceived" → kênh push qua SignalR (có thêm isCritical)
 *   - "UnreadCountChanged"   → payload là SỐ NGUYÊN trần, không bọc object
 *
 * Hub tự ghép nhóm theo claim trong JWT (`NotificationHub.OnConnectedAsync`) nên client
 * KHÔNG invoke gì sau khi connect — khác `useTicketCommentsRealtime` phải gọi `JoinTicket`.
 *
 * Chỉ mount MỘT lần toàn app (root layout): mỗi lần mount là một WebSocket riêng.
 */
export function useNotificationsRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // BASE_URL không có /api (axios.ts) ⇒ ghép thẳng; .replace phòng trường hợp env có đuôi /api.
    const hubUrl = `${BASE_URL.replace(/\/api$/, '')}${HUB_PATH}`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => (await getAccessToken()) ?? '',
      })
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    // Feed có phân trang + lọc theo params nên không patch tay được → invalidate để BE trả lại.
    //
    // CHỪA unread-count ra: badge đã được "UnreadCountChanged" ghi thẳng số chính xác. Invalidate
    // cả nhánh thì mỗi noti mới lại kéo thêm một request unread-count — đúng thứ vừa bỏ polling
    // để tránh. Predicate lọc theo key[1] nên bao cả `list` lẫn `infinite`.
    const invalidateFeed = () => {
      queryClient.invalidateQueries({
        predicate: (q) => q.queryKey[0] === KEY.notifications[0] && q.queryKey[1] !== 'unread-count',
      });
    };

    connection.on('NotificationCreated', invalidateFeed);
    connection.on('NotificationReceived', invalidateFeed);

    // Badge: BE gửi thẳng số chưa đọc → ghi vào cache, KHÔNG refetch.
    // Đây chính là request mà polling 30s trước đây bắn liên tục.
    connection.on('UnreadCountChanged', (unreadCount: number) => {
      if (typeof unreadCount !== 'number') return;
      queryClient.setQueryData(QUERY_KEY.notifications.unreadCount(), unreadCount);
    });

    // Nối lại sau khi rớt → có thể đã lỡ event. Ở đây invalidate CẢ unread-count (khác các handler
    // trên): badge lúc này thực sự có thể sai vì "UnreadCountChanged" phát lúc mất kết nối không
    // được gửi lại.
    connection.onreconnected(() => {
      queryClient.invalidateQueries({ queryKey: KEY.notifications });
    });

    // Giữ promise start() để cleanup CHỜ nó settle trước khi stop(). Gọi stop() khi start() còn
    // pending → SignalR ném "Failed to start the HttpConnection before stop() was called".
    const startPromise = connection.start().catch(() => {
      // Realtime không khả dụng → im lặng. REST vẫn phục vụ đủ dữ liệu (BE cũng coi realtime là
      // lớp tăng tốc, không phải nguồn dữ liệu).
    });

    // Khác web: OS có thể đóng socket khi app xuống background mà không bắn onclose kịp, và
    // `withAutomaticReconnect` chỉ chạy lại khi phát hiện đứt. Quay lại foreground thì ép nối lại
    // nếu đã Disconnected, đồng thời đồng bộ lại badge cho khoảng thời gian app không nghe.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const conn = connectionRef.current;
      if (!conn) return;
      if (conn.state === signalR.HubConnectionState.Disconnected) {
        conn.start().catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: KEY.notifications });
    });

    return () => {
      appStateSub.remove();
      const conn = connectionRef.current;
      connectionRef.current = null;
      if (!conn) return;
      // Gỡ handler TRƯỚC khi stop — chống event treo bắn vào connection đang teardown.
      conn.off('NotificationCreated');
      conn.off('NotificationReceived');
      conn.off('UnreadCountChanged');
      void startPromise.finally(() => {
        if (
          conn.state === signalR.HubConnectionState.Connected ||
          conn.state === signalR.HubConnectionState.Connecting
        ) {
          conn.stop().catch(() => {});
        }
      });
    };
  }, [queryClient, enabled]);
}
