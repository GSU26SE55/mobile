import axios, { create as axiosCreate } from 'axios';
import { ENDPOINTS } from './endpoints';
import {
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  saveTokens,
  clearTokens,
} from './secureStore';
import { useSessionStore } from '../stores/sessionStore';
import { router } from 'expo-router';
import { EntityError, HttpError } from './errors';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export const axiosInstance = axiosCreate({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const flushQueue = (token: string | null, err: unknown = null) => {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  pendingQueue = [];
};

const tryRefresh = async (): Promise<string | null> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  const timer = setTimeout(() => {
    isRefreshing = false;
    flushQueue(null, new Error('Refresh timeout'));
  }, 10_000);

  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const res = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
      `${BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      { refreshToken },
    );

    const { accessToken, refreshToken: newRefresh } = res.data.data;
    await saveTokens(accessToken, newRefresh);
    flushQueue(accessToken);
    return accessToken;
  } catch (err) {
    flushQueue(null, err);
    await clearTokens();
    useSessionStore.getState().clearSession();
    router.replace('/(auth)/login');
    return null;
  } finally {
    clearTimeout(timer);
    isRefreshing = false;
  }
};

const PUBLIC_ENDPOINTS = new Set([
  ENDPOINTS.AUTH.LOGIN,
  ENDPOINTS.AUTH.REGISTER,
  ENDPOINTS.AUTH.VERIFY_OTP,
  ENDPOINTS.AUTH.RESEND_OTP,
  ENDPOINTS.AUTH.FORGOT_PASSWORD,
  ENDPOINTS.AUTH.VERIFY_RESET_OTP,
  ENDPOINTS.AUTH.RESEND_RESET_OTP,
  ENDPOINTS.AUTH.RESET_PASSWORD,
  ENDPOINTS.AUTH.REFRESH_TOKEN,
]);

axiosInstance.interceptors.request.use(async (config) => {
  const url = config.url ?? '';
  if ([...PUBLIC_ENDPOINTS].some((ep) => url.endsWith(ep))) return config;

  const token = await getAccessToken();
  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    const newToken = await tryRefresh();
    if (newToken) config.headers.Authorization = `Bearer ${newToken}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => {
    // BE có thể trả 200 OK nhưng isSuccess: false cho business logic errors.
    // Axios không tự throw trong trường hợp này → phải check thủ công.
    const data = res.data;
    if (data && typeof data === 'object' && data.isSuccess === false) {
      const hasFieldErrors = Array.isArray(data.listErrors) && data.listErrors.length > 0;
      if (hasFieldErrors) {
        return Promise.reject(new EntityError(data));
      }
      return Promise.reject(new HttpError(res.status, data));
    }
    return res;
  },
  async (err) => {
    const status: number = err.response?.status;
    const payload = err.response?.data;

    // 401 → try refresh once
    if (status === 401 && !err.config._retried) {
      err.config._retried = true;
      const newToken = await tryRefresh();
      if (newToken) {
        err.config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(err.config);
      }
    }

    // Wrap BE error into HttpError / EntityError so screens can catch them
    if (payload && typeof payload === 'object') {
      const hasFieldErrors = Array.isArray(payload.listErrors) && payload.listErrors.length > 0;
      if (hasFieldErrors) {
        return Promise.reject(new EntityError(payload));
      }
      return Promise.reject(new HttpError(status, payload));
    }

    return Promise.reject(err);
  },
);
