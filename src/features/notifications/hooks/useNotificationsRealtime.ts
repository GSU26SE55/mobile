import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import { BASE_URL } from '@/src/lib/axios';
import { getAccessToken } from '@/src/lib/secureStore';
import { KEY, QUERY_KEY } from '@/src/lib/queryKeys';

const HUB_PATH = '/hubs/notifications';

/**
 * SignalR realtime for the in-app notification feed — replaces `useUnreadCount`'s 30s polling.
 *
 * Event names MUST match BE (`SignalRNotificationNotifier`):
 *   - "NotificationCreated"  → writes a new in-app notification
 *   - "NotificationReceived" → push channel via SignalR (also carries isCritical)
 *   - "UnreadCountChanged"   → payload is a RAW INTEGER, not wrapped in an object
 *
 * The hub auto-groups by the claim in the JWT (`NotificationHub.OnConnectedAsync`), so the client
 * does NOT invoke anything after connecting — unlike `useTicketCommentsRealtime`, which must call `JoinTicket`.
 *
 * Mounted only ONCE app-wide (root layout): each mount opens its own WebSocket.
 */
export function useNotificationsRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // BASE_URL has no /api (axios.ts) ⇒ concatenated directly; .replace guards against an env with a trailing /api.
    const hubUrl = `${BASE_URL.replace(/\/api$/, '')}${HUB_PATH}`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => (await getAccessToken()) ?? '',
      })
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    // The feed is paginated + filtered by params, so it can't be patched by hand → invalidate to let BE return it fresh.
    //
    // EXCLUDES unread-count: the badge already gets the exact number written by "UnreadCountChanged". Invalidating
    // that branch too would make every new notification trigger an extra unread-count request — exactly what
    // dropping polling was meant to avoid. The predicate filters by key[1] so it covers both `list` and `infinite`.
    const invalidateFeed = () => {
      queryClient.invalidateQueries({
        predicate: (q) => q.queryKey[0] === KEY.notifications[0] && q.queryKey[1] !== 'unread-count',
      });
    };

    connection.on('NotificationCreated', invalidateFeed);
    connection.on('NotificationReceived', invalidateFeed);

    // Badge: BE sends the unread count directly → write it to the cache, do NOT refetch.
    // This is exactly the request the previous 30s polling used to fire repeatedly.
    connection.on('UnreadCountChanged', (unreadCount: number) => {
      if (typeof unreadCount !== 'number') return;
      queryClient.setQueryData(QUERY_KEY.notifications.unreadCount(), unreadCount);
    });

    // Reconnected after a drop → may have missed an event. Here it invalidates unread-count TOO (unlike the
    // handlers above): the badge could genuinely be wrong now, because "UnreadCountChanged" events fired while
    // disconnected are not resent.
    connection.onreconnected(() => {
      queryClient.invalidateQueries({ queryKey: KEY.notifications });
    });

    // Keeps the start() promise so cleanup WAITS for it to settle before calling stop(). Calling stop() while
    // start() is still pending → SignalR throws "Failed to start the HttpConnection before stop() was called".
    const startPromise = connection.start().catch(() => {
      // Realtime unavailable → fail silently. REST still serves enough data (BE also treats realtime as
      // an acceleration layer, not a data source).
    });

    // Unlike web: the OS can close the socket when the app goes to background without firing onclose in time,
    // and `withAutomaticReconnect` only kicks in once a drop is detected. On returning to foreground, force a
    // reconnect if Disconnected, and re-sync the badge for the period the app wasn't listening.
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
      // Remove handlers BEFORE stop — guards against a stray event firing into a connection mid-teardown.
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
