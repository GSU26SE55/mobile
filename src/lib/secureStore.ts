import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

const ACCESS_KEY  = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const getToken  = (key: string) => SecureStore.getItemAsync(key);
export const setToken  = (key: string, value: string) => SecureStore.setItemAsync(key, value);
export const clearToken = (key: string) => SecureStore.deleteItemAsync(key);

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
};

export const clearTokens = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
};

export const getAccessToken  = () => SecureStore.getItemAsync(ACCESS_KEY);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY);

export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= exp * 1000 - 30_000;
  } catch {
    return true;
  }
};
