import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { saveTokens, clearTokens, clearToken } from '@/src/lib/secureStore';
import { decodeToken, redirectByRole } from '@/src/types/session.types';
import { useSessionStore } from '@/src/stores/sessionStore';
import { Verify2faLoginPayload, CHALLENGE_TOKEN_KEY } from '../types/auth.types';
import { syncDeviceTokenOnLogin } from '@/src/features/notifications/services/device-token.service';

// GH-295: bước 2 của 2FA login — verify TOTP/backup code → cấp token (giống login Case A)
export function useVerify2faLogin() {
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: (data: Verify2faLoginPayload) => authService.verify2faLogin(data),
    onSuccess: async (res) => {
      const tokens = res.data.data?.tokens;
      if (!tokens) {
        Alert.alert('Lỗi', 'Xác thực 2FA thất bại.');
        return;
      }

      const { accessToken, refreshToken } = tokens;
      await saveTokens(accessToken, refreshToken);
      await clearToken(CHALLENGE_TOKEN_KEY);
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

      // Đăng ký push token (best-effort, không chặn luồng login).
      void syncDeviceTokenOnLogin();
    },
  });
}
