import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { saveTokens, clearTokens } from '../../../lib/secureStore';
import { decodeToken, redirectByRole } from '../../../types/session.types';
import { useSessionStore } from '../../../stores/sessionStore';
import { LoginPayload } from '../types/auth.types';

export function useLogin() {
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: (data: LoginPayload) => authService.login(data),
    onSuccess: async (res) => {
      // isSuccess: false đã được interceptor bắt trước — onSuccess chỉ chạy khi thực sự thành công
      const { accessToken, refreshToken } = res.data.data!;
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
