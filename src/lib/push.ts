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
