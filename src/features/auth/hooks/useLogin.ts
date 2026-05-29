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
      const body = res.data;
      if (!body.isSuccess || !body.data) {
        Alert.alert('Đăng nhập thất bại', body.message ?? 'Vui lòng thử lại.');
        return;
      }

      const { accessToken, refreshToken } = body.data;
      await saveTokens(accessToken, refreshToken);
      const user = decodeToken(accessToken);
      const dest = redirectByRole(user.role);

      if (!dest) {
        Alert.alert('Không hỗ trợ', 'Tài khoản Admin/Manager vui lòng dùng Web App.');
        await clearTokens();
        clearSession();
        return;
      }

      setSession(user);
      router.replace(dest as never);
    },
    onError: () => {
      Alert.alert('Lỗi', 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    },
  });
}
