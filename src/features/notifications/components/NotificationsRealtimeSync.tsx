import { useSessionStore } from '@/src/stores/sessionStore';
import { useNotificationsRealtime } from '../hooks/useNotificationsRealtime';

/**
 * Mounted once at the root layout to keep exactly ONE SignalR connection for the notification feed. Renders no UI.
 *
 * Only connects once logged in: the hub is `[Authorize]`, connecting without a token just gets a 401 and
 * `withAutomaticReconnect` retries pointlessly. When `user` changes (login/logout) → the hook rebuilds the
 * connection with the new token.
 */
export function NotificationsRealtimeSync() {
  const user = useSessionStore((s) => s.user);
  useNotificationsRealtime(!!user);
  return null;
}
