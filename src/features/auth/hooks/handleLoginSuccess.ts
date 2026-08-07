import { Alert } from 'react-native';
import { router } from 'expo-router';
import { saveTokens, clearTokens, setToken } from '../../../lib/secureStore';
import { decodeToken, redirectByRole } from '../../../types/session.types';
import { useSessionStore } from '../../../stores/sessionStore';
import { LoginResultData, CHALLENGE_TOKEN_KEY } from '../types/auth.types';

/**
 * Xử lý kết quả login thành công — DÙNG CHUNG cho useLogin (email/password) và
 * useGoogleLogin (Google idToken). Response shape của cả 2 endpoint đều là LoginResultData
 * (token hoặc 2FA challenge), nên luồng post-login giống hệt nhau.
 */
export async function handleLoginSuccess(data: LoginResultData): Promise<void> {
  const setSession = useSessionStore.getState().setSession;
  const clearSession = useSessionStore.getState().clearSession;

  // GH-295: 2FA on → trả challenge, chưa có token.
  if (data.requiresTwoFactor && data.challenge) {
    await setToken(CHALLENGE_TOKEN_KEY, data.challenge.challengeToken);
    router.push('/(auth)/login-2fa' as never);
    return;
  }

  if (!data.tokens) {
    Alert.alert('Lỗi', 'Đăng nhập thất bại.');
    return;
  }

  const { accessToken, refreshToken } = data.tokens;
  await saveTokens(accessToken, refreshToken);
  const user = decodeToken(accessToken);
  const dest = redirectByRole(user.role);

  if (!dest) {
    // ADMIN/MANAGER không dùng mobile — không giữ session, điều hướng sang trang hướng dẫn dùng Web App
    await clearTokens();
    clearSession();
    router.replace('/(auth)/use-web-app' as never);
    return;
  }

  setSession(user);
  router.replace(dest as never);
}
