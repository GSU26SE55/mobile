import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { KEY } from '../../../lib/queryKeys';
import {
  ensureAndroidChannels,
  requestNotificationPermission,
  syncBadge,
} from '../../../lib/notifications';
import { useSessionStore } from '../../../stores/sessionStore';
import {
  registerNotificationSync,
  unregisterNotificationSync,
  syncMissedNotifications,
} from '../lib/backgroundSync';
import { useNotificationStream } from '../hooks/useNotificationStream';
import { useUnreadCount } from '../hooks/useNotifications';

/** Starts local notification permission, realtime delivery, tap routing, and REST catch-up. */
export function NotificationBootstrap() {
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const isAuthed = !!user;
  const { data: unreadCount = 0 } = useUnreadCount(isAuthed);

  useNotificationStream(isAuthed);

  useEffect(() => {
    if (!isAuthed) {
      void unregisterNotificationSync();
      void syncBadge(0);
      return;
    }

    let cancelled = false;
    void (async () => {
      await ensureAndroidChannels();
      await requestNotificationPermission();
      await syncMissedNotifications();
      if (!cancelled) await registerNotificationSync();
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  useEffect(() => {
    if (isAuthed) void syncBadge(unreadCount);
  }, [isAuthed, unreadCount]);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    if (!isAuthed) return;

    const subscription = AppState.addEventListener('change', (next) => {
      const cameToForeground = appState.current.match(/inactive|background/) && next === 'active';
      appState.current = next;
      if (!cameToForeground) return;

      queryClient.invalidateQueries({ queryKey: KEY.notifications });
      queryClient.invalidateQueries({ queryKey: KEY.tickets });
      queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
      void syncMissedNotifications().catch(() => {});
    });

    return () => subscription.remove();
  }, [isAuthed, queryClient]);

  return null;
}
