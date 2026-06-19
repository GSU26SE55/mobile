import axios, { create as axiosCreate } from 'axios';
import { router } from 'expo-router';
import { useSessionStore } from '../stores/sessionStore';
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

    const res = await axios.post<{ isSuccess: boolean; data: { tokens: { accessToken: string; refreshToken: string } | null } }>(
      `${BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      { refreshToken },
    );

    // GH-295: refresh trả LoginResultDto — token nằm trong data.tokens
    if (!res.data?.isSuccess || !res.data.data?.tokens) throw new Error('Refresh failed');
    const { accessToken, refreshToken: newRefresh } = res.data.data.tokens;
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
  console.log(`[API] → ${config.method?.toUpperCase()} ${url}`);

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
  400: 'Yêu cầu không hợp lệ',
  401: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại',
  403: 'Bạn không có quyền thực hiện thao tác này',
  404: 'Không tìm thấy dữ liệu yêu cầu',
  405: 'Phương thức không được hỗ trợ',
  409: 'Dữ liệu bị xung đột, vui lòng kiểm tra lại',
  422: 'Dữ liệu không hợp lệ theo quy tắc nghiệp vụ',
  429: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau',
  500: 'Lỗi máy chủ nội bộ, vui lòng thử lại sau',
  502: 'Cổng kết nối lỗi, vui lòng thử lại sau',
  503: 'Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau',
  504: 'Kết nối máy chủ hết thời gian chờ, vui lòng thử lại sau',
};

const makeFallbackPayload = (status: number, serverMessage?: string) => ({
  isSuccess: false,
  statusCode: status,
  message: serverMessage || HTTP_ERROR_MESSAGES[status] || `Đã xảy ra lỗi (${status})`,
  data: null,
  listErrors: [],
});

axiosInstance.interceptors.response.use(
  (res) => {
    console.log(`[API] ← ${res.status} ${res.config.method?.toUpperCase()} ${res.config.url}`);

    // BE có thể trả 200 OK nhưng isSuccess: false cho business logic errors.
    // Axios không tự throw trong trường hợp này → phải check thủ công.
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

    // 401 → CHỈ TOKEN_EXPIRED mới thử refresh (token còn hợp lệ nhưng hết hạn).
    // MISSING_TOKEN (không có token), INVALID_SIGNATURE / INVALID_TOKEN (token hỏng/giả mạo)
    // → refresh vô nghĩa → logout ngay. Đồng bộ với web (shared/lib/axios.ts).
    if (status === 401) {
      const errorCode = payload?.data?.errorCode;
      const retryCount: number = err.config._retryCount ?? 0;

      const logoutAndReject = async () => {
        await clearTokens();
        useSessionStore.getState().clearSession();
        router.replace('/(auth)/login');
        return Promise.reject(new HttpError(status, makeFallbackPayload(status, payload?.message)));
      };

      // errorCode khác TOKEN_EXPIRED, hoặc đã retry 1 lần vẫn fail → logout.
      if (errorCode !== 'TOKEN_EXPIRED' || retryCount >= 1) {
        return logoutAndReject();
      }

      err.config._retryCount = retryCount + 1;
      const newToken = await tryRefresh();
      // tryRefresh OK → đã saveTokens (secure-store) với token mới → đệ quy gọi lại request.
      if (newToken) {
        err.config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(err.config);
      }
      // tryRefresh trả null → bên trong đã logout rồi, chỉ cần reject.
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
