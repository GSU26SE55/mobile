import { Alert } from 'react-native';
import { router } from 'expo-router';
import { saveTokens, clearTokens, setToken } from '@/src/lib/secureStore';
import { decodeToken, redirectByRole } from '@/src/types/session.types';
import { useSessionStore } from '@/src/stores/sessionStore';
import { LoginResultData, CHALLENGE_TOKEN_KEY } from '../types/auth.types';
import { syncDeviceTokenOnLogin } from '@/src/features/notifications/services/device-token.service';

/**
 * Handles a successful login result — SHARED by useLogin (email/password) and
 * useGoogleLogin (Google idToken). Both endpoints' response shape is LoginResultData
 * (token or 2FA challenge), so the post-login flow is identical.
 */
export async function handleLoginSuccess(data: LoginResultData): Promise<void> {
  const setSession = useSessionStore.getState().setSession;
  const clearSession = useSessionStore.getState().clearSession;

  // GH-295: 2FA on → returns a challenge, no token yet.
  if (data.requiresTwoFactor && data.challenge) {
    await setToken(CHALLENGE_TOKEN_KEY, data.challenge.challengeToken);
    router.push('/(auth)/login-2fa' as never);
    return;
  }

  if (!data.tokens) {
    Alert.alert('Error', 'Sign-in failed.');
    return;
  }

  const { accessToken, refreshToken } = data.tokens;
  await saveTokens(accessToken, refreshToken);
  const user = decodeToken(accessToken);
  const dest = redirectByRole(user.role);

  if (!dest) {
    // ADMIN/MANAGER don't use mobile — don't keep the session, redirect to the "use Web App" guidance page
    await clearTokens();
    clearSession();
    router.replace('/(auth)/use-web-app' as never);
    return;
  }

  setSession(user);
  router.replace(dest as never);

  // Đăng ký push token (best-effort, không chặn luồng login).
  void syncDeviceTokenOnLogin();
}
