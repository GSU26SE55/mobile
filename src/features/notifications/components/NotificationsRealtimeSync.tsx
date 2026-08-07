import { useSessionStore } from '@/src/stores/sessionStore';
import { useNotificationsRealtime } from '../hooks/useNotificationsRealtime';

/**
 * Mount 1 lần ở root layout để giữ đúng MỘT kết nối SignalR cho feed thông báo. Không render UI.
 *
 * Chỉ nối khi đã đăng nhập: hub `[Authorize]`, nối lúc chưa có token chỉ tổ nhận 401 rồi
 * `withAutomaticReconnect` thử lại vô ích. `user` đổi (login/logout) → hook tự dựng lại kết nối
 * với token mới.
 */
export function NotificationsRealtimeSync() {
  const user = useSessionStore((s) => s.user);
  useNotificationsRealtime(!!user);
  return null;
}
