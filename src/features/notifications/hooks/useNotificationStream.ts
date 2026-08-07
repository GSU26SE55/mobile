import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import { BASE_URL } from '../../../lib/axios';
import { getAccessToken } from '../../../lib/secureStore';
import { KEY, QUERY_KEY } from '../../../lib/queryKeys';
import { presentSystemNotification } from '../../../lib/notifications';
import { syncMissedNotifications } from '../lib/backgroundSync';
import { advanceLastSeen } from '../lib/lastSeen';
import { NotificationDTO } from '../types/notification.types';

const HUB_PATH = '/hubs/notifications';

/**
 * Keeps the in-app feed live and turns self-hosted SignalR Push events into local OS banners.
 */
export function useNotificationStream(enabled: boolean) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const hubUrl = `${BASE_URL.replace(/\/api$/, '')}${HUB_PATH}`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => (await getAccessToken()) ?? '',
      })
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: KEY.notifications });
    };

    connection.on('NotificationCreated', invalidateAll);
    connection.on(
      'NotificationReceived',
      (notification: NotificationDTO & { isCritical?: boolean }) => {
        invalidateAll();
        void presentSystemNotification(notification, notification.isCritical)
          .then(() => advanceLastSeen(notification.createdAt))
          .catch(() => {});
      },
    );
    connection.on('UnreadCountChanged', (count: number) => {
      if (Number.isFinite(count)) {
        queryClient.setQueryData(QUERY_KEY.notifications.unreadCount(), Math.max(0, count));
      }
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      invalidateAll();
      void syncMissedNotifications().catch(() => {});
    });
    connection.onclose(() => setIsConnected(false));

    let cancelled = false;
    const startPromise = connection
      .start()
      .then(() => {
        if (cancelled) return;
        setIsConnected(true);
        invalidateAll();
      })
      .catch(() => {
        // REST polling remains the fallback when WebSockets are unavailable.
      });

    return () => {
      cancelled = true;
      const active = connectionRef.current;
      connectionRef.current = null;
      if (active) {
        active.off('NotificationCreated');
        active.off('NotificationReceived');
        active.off('UnreadCountChanged');
        void startPromise.finally(() => active.stop().catch(() => {}));
      }
      setIsConnected(false);
    };
  }, [enabled, queryClient]);

  return { isConnected };
}
