import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { clearTokens, getRefreshToken } from '@/src/lib/secureStore';
import { useSessionStore } from '@/src/stores/sessionStore';
import { clearLastSeen } from '@/src/features/notifications/lib/lastSeen';

export function useLogout() {
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async () => {
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
