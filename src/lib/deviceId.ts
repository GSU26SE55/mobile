import * as Crypto from 'expo-crypto';
import { getToken, setToken } from './secureStore';

// #AUTH-48: device id ổn định per-install → fingerprint trust device (SHA256(deviceId|UA) ở BE).
const DEVICE_ID_KEY = 'device_id';

// Cache in-memory — tránh đọc SecureStore mỗi request (interceptor gọi mỗi call).
let cachedDeviceId: string | null = null;

/**
 * Trả về device id ổn định: đọc SecureStore, nếu chưa có thì sinh UUID v4 (expo-crypto) và lưu lại.
 * Cố định per-install — KHÔNG đổi theo phiên/bản app để trust device sống sót qua restart/update.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const existing = await getToken(DEVICE_ID_KEY);
  if (existing) {
    cachedDeviceId = existing;
    return existing;
  }

  const newId = Crypto.randomUUID();
  await setToken(DEVICE_ID_KEY, newId);
  cachedDeviceId = newId;
  return newId;
}
