import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { addPushResponseListener, PushData } from '../../../lib/push';
import { useMarkNotificationOpened } from '../hooks/useNotifications';

/**
 * GH-83 — xử lý cú bấm vào push notification: báo "đã mở" + điều hướng tới nội dung.
 *
 * Không render gì; gắn 1 lần ở root layout (bên trong QueryClientProvider vì dùng mutation).
 *
 * Vì sao tách khỏi `push.ts`: file đó là wrapper thuần expo-notifications, không biết gì về router
 * hay TanStack Query. Đặt điều hướng vào đó sẽ buộc nó phụ thuộc ngược lên tầng UI.
 */
export function PushResponseHandler() {
  const router = useRouter();
  const markOpened = useMarkNotificationOpened();

  // Giữ tham chiếu mới nhất để listener chỉ đăng ký MỘT lần — đăng ký lại theo mỗi render sẽ làm
  // rơi sự kiện cold-start (nó chỉ phát đúng một lần).
  const handlerRef = useRef<(data: PushData) => void>(() => {});

  handlerRef.current = ({ notificationId, ticketId }: PushData) => {
    // Push cũ (BE chưa deploy bản gắn notificationId) → bỏ qua bước telemetry, vẫn điều hướng.
    if (notificationId) markOpened.mutate(notificationId);

    // Chỉ điều hướng khi biết chắc đích đến. Push không có ticketId thì để user ở nguyên màn đang mở
    // còn hơn quăng họ về dashboard.
    if (ticketId) router.push(`/(customer)/tickets/${ticketId}`);
  };

  useEffect(() => {
    return addPushResponseListener((data) => handlerRef.current(data));
  }, []);

  return null;
}
