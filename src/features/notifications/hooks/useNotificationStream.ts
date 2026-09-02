import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";
import { BASE_URL } from "../../../lib/axios";
import { getAccessToken } from "../../../lib/secureStore";
import { KEY, QUERY_KEY } from "../../../lib/queryKeys";
import { presentSystemNotification } from "../../../lib/notifications";
import { syncMissedNotifications } from "../lib/backgroundSync";
import { advanceLastSeen } from "../lib/lastSeen";
import { useSessionStore } from "../../../stores/sessionStore";
import { NotificationDTO } from "../types/notification.types";

const HUB_PATH = "/hubs/notifications";

/**
 * Keeps the in-app feed live and turns self-hosted SignalR Push events into local OS banners.
 */
export function useNotificationStream(enabled: boolean) {
  const queryClient = useQueryClient();
  const role = useSessionStore((state) => state.user?.role);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const hubUrl = `${BASE_URL.replace(/\/api$/, "")}${HUB_PATH}`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => (await getAccessToken()) ?? "",
      })
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: KEY.notifications });
    };

    // Only the query key that exists for this role has anything to invalidate — the other
    // role's key is simply absent from the cache, so invalidating it every event is dead work.
    const invalidateAllLifecycle = () => {
      queryClient.invalidateQueries({
        queryKey: role === "STAFF" ? KEY.staffTickets : KEY.tickets,
      });
    };

    const invalidateTicketLifecycle = (notification?: NotificationDTO) => {
      if (
        notification?.entityType !== "Ticket" ||
        !notification.entityId ||
        !/^[0-9a-f-]{36}$/i.test(notification.entityId)
      )
        return;
      queryClient.invalidateQueries({
        queryKey:
          role === "STAFF"
            ? QUERY_KEY.staffTickets.detail(notification.entityId)
            : QUERY_KEY.tickets.detail(notification.entityId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.tickets.activities(notification.entityId),
      });
      invalidateAllLifecycle();
    };

    connection.on("NotificationCreated", (notification?: NotificationDTO) => {
      invalidateAll();
      invalidateTicketLifecycle(notification);
    });
    connection.on(
      "NotificationReceived",
      (notification: NotificationDTO & { isCritical?: boolean }) => {
        invalidateAll();
        invalidateTicketLifecycle(notification);
        void presentSystemNotification(notification, notification.isCritical)
          .then(() => advanceLastSeen(notification.createdAt))
          .catch(() => {});
      },
    );
    connection.on("UnreadCountChanged", (count: number) => {
      if (Number.isFinite(count)) {
        queryClient.setQueryData(
          QUERY_KEY.notifications.unreadCount(),
          Math.max(0, count),
        );
      }
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      invalidateAll();
      invalidateAllLifecycle();
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
        invalidateAllLifecycle();
      })
      .catch(() => {
        // REST polling remains the fallback when WebSockets are unavailable.
      });

    return () => {
      cancelled = true;
      const active = connectionRef.current;
      connectionRef.current = null;
      if (active) {
        active.off("NotificationCreated");
        active.off("NotificationReceived");
        active.off("UnreadCountChanged");
        void startPromise.finally(() => active.stop().catch(() => {}));
      }
      setIsConnected(false);
    };
  }, [enabled, queryClient, role]);

  return { isConnected };
}
