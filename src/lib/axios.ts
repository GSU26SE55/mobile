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

axiosInstance.interceptors.request.use(async (config) => {
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
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retried) {
      err.config._retried = true;
      const newToken = await tryRefresh();
      if (newToken) {
        err.config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(err.config);
      }
    }
    return Promise.reject(err);
  },
);
