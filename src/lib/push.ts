import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DevicePlatformEnum } from '../features/notifications/enums/notification.enum';

/** Map Platform.OS → DevicePlatformEnum (khớp BE). */
export function getDevicePlatform(): DevicePlatformEnum {
  if (Platform.OS === 'ios') return DevicePlatformEnum.Ios;
  if (Platform.OS === 'android') return DevicePlatformEnum.Android;
  return DevicePlatformEnum.Web;
}

/** Mô tả thiết bị từ Platform built-in — dùng `Platform`, không thêm expo-device. */
export function getDeviceInfo(): string {
  return `${Platform.OS} ${Platform.Version}`;
}

/**
 * Dữ liệu kèm theo một push. GH-83 — BE (`ExpoPushChannel`) LUÔN gắn `notificationId`, kể cả khi
 * message vượt trần 4KB (lúc đó context nghiệp vụ bị bỏ, id vẫn còn).
 *
 * Vẫn khai optional vì thiết bị có thể nhận push **cũ** do BE bản trước gửi — khi đó không có id và
 * client chỉ điều hướng, không gọi `/opened`.
 */
export interface PushData {
  notificationId?: string;
  ticketId?: string;
  chatId?: string;
}

/** Đọc `data` của một push response về shape đã biết. Không ném lỗi — push lạ thì trả object rỗng. */
export function readPushData(response: Notifications.NotificationResponse | null): PushData {
  const raw = response?.notification?.request?.content?.data;
  if (!raw || typeof raw !== 'object') return {};

  const data = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : undefined);

  return {
    notificationId: str(data.notificationId),
    ticketId: str(data.ticketId),
    chatId: str(data.chatId),
  };
}

/**
 * Đăng ký handler cho sự kiện user **bấm** vào push.
 *
 * Bao gồm cả **cold-start**: nếu app đang tắt hẳn lúc user bấm, sự kiện không đi qua listener mà chỉ
 * còn trong `getLastNotificationResponseAsync()`. Thiếu nhánh này là mất trọn trường hợp phổ biến
 * nhất — người dùng thường bấm push khi chưa mở app.
 *
 * Trả về hàm huỷ đăng ký.
 */
export function addPushResponseListener(
  onResponse: (data: PushData) => void,
): () => void {
  let disposed = false;

  // Cold-start: đọc response cuối cùng đã "đánh thức" app.
  Notifications.getLastNotificationResponseAsync()
    .then((last) => {
      if (disposed || !last) return;
      onResponse(readPushData(last));
    })
    .catch(() => {
      // Best-effort: không có quyền / chạy simulator → bỏ qua, không được làm vỡ boot.
    });

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onResponse(readPushData(response));
  });

  return () => {
    disposed = true;
    subscription.remove();
  };
}

/**
 * Xin permission + lấy Expo push token.
 * Best-effort: trả `null` nếu user từ chối permission, chạy trên simulator,
 * thiếu EAS projectId, hoặc bất kỳ lỗi nào — caller không được để fail chặn auth.
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}
