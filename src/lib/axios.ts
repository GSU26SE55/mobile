import axios, { create as axiosCreate } from 'axios';
import { Platform } from 'react-native';
import { useSessionStore } from '@/src/stores/sessionStore';
import { getDeviceId } from './deviceId';
import { ENDPOINTS } from './endpoints';
import { EntityError, HttpError } from './errors';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  saveTokens,
} from './secureStore';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

/**
 * Timeout for requests that go through AI (Gemini) on the BE — message translation, reply suggestions, conversation summaries.
 * LLM text generation is much slower than regular CRUD; the default 15s often cuts it off mid-response, so this is raised to 60s.
 * Only pass this for those specific calls (`{ timeout: AI_TIMEOUT }`) — regular requests keep the 15s timeout
 * so network errors still surface quickly.
 */
export const AI_TIMEOUT = 60_000;

export const axiosInstance = axiosCreate({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    // #AUTH-48: UA is stable per-install (does NOT include app version) for the trusted-device fingerprint.
    // Best-effort: RN Android (OkHttp) may override this — the fingerprint stays deterministic thanks to the stable default UA.
    'User-Agent': `SolarBatteryMobile (${Platform.OS})`,
  },
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

    const res = await axios.post<{ isSuccess: boolean; data: { tokens: { accessToken: string; refreshToken: string } | null } }>(
      `${BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      { refreshToken },
    );

    // GH-295: refresh returns LoginResultDto — the token is nested in data.tokens
    if (!res.data?.isSuccess || !res.data.data?.tokens) throw new Error('Refresh failed');
    const { accessToken, refreshToken: newRefresh } = res.data.data.tokens;
    await saveTokens(accessToken, newRefresh);
    flushQueue(accessToken);
    return accessToken;
  } catch (err) {
    flushQueue(null, err);
    await clearTokens();
    // Only clear the session — do NOT router.replace() here. The interceptor runs outside React,
    // so a navigation call here could land mid-render and collide with the guard's declarative
    // <Redirect>. Setting user = null is enough: the guard sends it back to login on the next commit.
    useSessionStore.getState().clearSession();
    return null;
  } finally {
    clearTimeout(timer);
    isRefreshing = false;
  }
};

const PUBLIC_ENDPOINTS = new Set([
  ENDPOINTS.AUTH.LOGIN,
  ENDPOINTS.AUTH.LOGIN_VERIFY_2FA, // GH-295 bug-fix: there's no token at this step → avoid tryRefresh→logout
  ENDPOINTS.AUTH.LOGIN_2FA_SMS,    // #AUTH-58 — called mid-login (not yet authenticated)
  ENDPOINTS.AUTH.REACTIVATE_REQUEST, // #AUTH-50 — public
  ENDPOINTS.AUTH.REACTIVATE_VERIFY,  // #AUTH-50 — public
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
  console.log(`[API] → ${config.method?.toUpperCase()} ${url}`);

  // #AUTH-48: attach X-Device-Id to EVERY request (including public verify-2fa) — needed for the trusted-device fingerprint.
  config.headers['X-Device-Id'] = await getDeviceId();

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

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request',
  401: 'Your session has expired, please sign in again',
  403: 'You do not have permission to perform this action',
  404: 'The requested data was not found',
  405: 'Method not supported',
  409: 'Data conflict, please check and try again',
  422: 'Data is invalid according to business rules',
  429: 'You have sent too many requests, please try again later',
  500: 'Internal server error, please try again later',
  502: 'Gateway error, please try again later',
  503: 'Service temporarily unavailable, please try again later',
  504: 'Server connection timed out, please try again later',
};

const makeFallbackPayload = (status: number, serverMessage?: string) => ({
  isSuccess: false,
  statusCode: status,
  message: serverMessage || HTTP_ERROR_MESSAGES[status] || `An error occurred (${status})`,
  data: null,
  listErrors: [],
});

axiosInstance.interceptors.response.use(
  (res) => {
    console.log(`[API] ← ${res.status} ${res.config.method?.toUpperCase()} ${res.config.url}`);

    // BE may return 200 OK but isSuccess: false for business logic errors.
    // Axios doesn't auto-throw in this case → must check it manually.
    const data = res.data;
    console.debug(`[API] response data for ${res.config.url}:`, data);
    if (data && typeof data === 'object' && data.isSuccess === false) {
      
      const hasFieldErrors = Array.isArray(data.listErrors) && data.listErrors.length > 0;
      if (hasFieldErrors) {
        console.warn(`[API] entity error ${res.config.url}:`, data);
        return Promise.reject(new EntityError(data, res.status));
      }
      console.warn(`[API] business error ${res.config.url}:`, data);
      return Promise.reject(new HttpError(res.status, data));
    }
    return res;
  },
  async (err) => {
    const status: number = err.response?.status;
    const payload = err.response?.data;
    console.error(
      `[API] ✗ ${status ?? 'NETWORK'} ${err.config?.method?.toUpperCase()} ${err.config?.url}:`,
      payload ?? err,
    );

    // 401 → ONLY TOKEN_EXPIRED attempts a refresh (token was valid but has expired).
    // MISSING_TOKEN (no token), INVALID_SIGNATURE / INVALID_TOKEN (corrupted/forged token)
    // → a refresh is meaningless → logout immediately. Kept in sync with web (shared/lib/axios.ts).
    if (status === 401) {
      const errorCode = payload?.data?.errorCode;
      const retryCount: number = err.config._retryCount ?? 0;

      // clearSession() is enough to have the declarative guard bounce to login — see the note in tryRefresh.
      const logoutAndReject = async () => {
        await clearTokens();
        useSessionStore.getState().clearSession();
        return Promise.reject(new HttpError(status, makeFallbackPayload(status, payload?.message)));
      };

      // errorCode other than TOKEN_EXPIRED, or already retried once and still failed → logout.
      if (errorCode !== 'TOKEN_EXPIRED' || retryCount >= 1) {
        return logoutAndReject();
      }

      err.config._retryCount = retryCount + 1;
      const newToken = await tryRefresh();
      // tryRefresh OK → already saveTokens (secure-store) with the new token → recursively retry the request.
      if (newToken) {
        err.config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(err.config);
      }
      // tryRefresh returned null → it already logged out internally, just reject.
      return Promise.reject(new HttpError(status, makeFallbackPayload(status, payload?.message)));
    }

    // Wrap BE error into HttpError / EntityError so screens can catch them
    if (payload && typeof payload === 'object') {
      const hasFieldErrors = Array.isArray(payload.listErrors) && payload.listErrors.length > 0;
      if (hasFieldErrors) {
        return Promise.reject(new EntityError(payload, status));
      }
      return Promise.reject(new HttpError(status, payload));
    }

    // No structured payload (502/503/504, network timeout, HTML error pages)
    const fallback = makeFallbackPayload(status, err.message);
    return Promise.reject(new HttpError(status ?? 0, fallback));
  },
);
