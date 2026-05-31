import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { clearTokens, getRefreshToken } from '../../../lib/secureStore';
import { useSessionStore } from '../../../stores/sessionStore';

export function useLogout() {
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch {
          // best-effort — vẫn clear local state dù server call fail
        }
      }
      await clearTokens();
      clearSession();
    },
    onSuccess: () => {
      router.replace('/(auth)/login');
    },
  });
}
