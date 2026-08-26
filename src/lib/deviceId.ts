import * as Crypto from 'expo-crypto';
import { getToken, setToken } from './secureStore';

// #AUTH-48: stable per-install device id → trusted-device fingerprint (SHA256(deviceId|UA) on the BE).
const DEVICE_ID_KEY = 'device_id';

// In-memory cache — avoids reading SecureStore on every request (the interceptor calls this every request).
let cachedDeviceId: string | null = null;

/**
 * Returns a stable device id: reads SecureStore, and if none exists yet, generates a UUID v4 (expo-crypto) and saves it.
 * Fixed per install — does NOT change across sessions/app versions, so trusted-device status survives restarts/updates.
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
