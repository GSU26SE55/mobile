import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { clearTokens, getRefreshToken } from '@/src/lib/secureStore';
import { useSessionStore } from '@/src/stores/sessionStore';
import { clearLastSeen } from '@/src/features/notifications/lib/lastSeen';
import { syncDeviceTokenOnLogout } from '@/src/features/notifications/services/device-token.service';

export function useLogout() {
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async () => {
      // Hủy đăng ký push token trước khi clear token (cần access token còn hợp lệ).
      await syncDeviceTokenOnLogout();

      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch {
          // best-effort — still clear local state even if the server call fails
        }
      }
      await clearLastSeen();
      await clearTokens();
      clearSession();
    },
    onSuccess: () => {
      router.replace('/(auth)/login');
    },
  });
}
