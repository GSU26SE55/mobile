import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { saveTokens, clearTokens, setToken } from '../../../lib/secureStore';
import { decodeToken, redirectByRole } from '../../../types/session.types';
import { useSessionStore } from '../../../stores/sessionStore';
import { LoginPayload, CHALLENGE_TOKEN_KEY } from '../types/auth.types';

export function useLogin() {
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: (data: LoginPayload) => authService.login(data),
    onSuccess: async (res) => {
      const data = res.data.data!;

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
        // Admin/Manager không dùng mobile app
        Alert.alert('Không hỗ trợ', 'Tài khoản Admin/Manager vui lòng dùng Web App.');
        await clearTokens();
        clearSession();
        return;
      }

      setSession(user);
      router.replace(dest as never);
    },
    // Không xử lý onError — error propagate lên caller (LoginForm try-catch)
  });
}
