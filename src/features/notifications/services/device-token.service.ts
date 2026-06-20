import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { getDeviceInfo, getDevicePlatform, getExpoPushToken } from '../../../lib/push';
import { CommonResponse } from '../../../types/api.types';
import {
  RegisterDeviceTokenPayload,
  UnregisterDeviceTokenPayload,
} from '../types/device-token.types';

const { DEVICE_TOKENS } = ENDPOINTS;

export const deviceTokenService = {
  // data = Id của device token (BE trả Guid, serialize thành string).
  register: (payload: RegisterDeviceTokenPayload) =>
    axiosInstance.post<CommonResponse<string>>(DEVICE_TOKENS.BASE, payload),

  unregister: (payload: UnregisterDeviceTokenPayload) =>
    axiosInstance.delete<CommonResponse<string>>(DEVICE_TOKENS.BASE, { data: payload }),
};

/**
 * Best-effort: lấy Expo push token + đăng ký với BE sau khi login thành công.
 * Không throw — permission denied / simulator / API fail đều bị nuốt để không chặn auth.
 */
export async function syncDeviceTokenOnLogin(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await deviceTokenService.register({
      token,
      platform: getDevicePlatform(),
      deviceInfo: getDeviceInfo(),
    });
  } catch {
    // best-effort — bỏ qua lỗi
  }
}

/** Best-effort: hủy đăng ký push token khi logout. Không throw. */
export async function syncDeviceTokenOnLogout(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await deviceTokenService.unregister({ token });
  } catch {
    // best-effort — bỏ qua lỗi
  }
}
