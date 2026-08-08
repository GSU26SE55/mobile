import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { saveTokens, clearTokens, clearToken } from '@/src/lib/secureStore';
import { decodeToken, redirectByRole } from '@/src/types/session.types';
import { useSessionStore } from '@/src/stores/sessionStore';
import { Verify2faLoginPayload, CHALLENGE_TOKEN_KEY } from '../types/auth.types';

// GH-295: step 2 of 2FA login — verify TOTP/backup code → issue token (same as login Case A)
export function useVerify2faLogin() {
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: (data: Verify2faLoginPayload) => authService.verify2faLogin(data),
    onSuccess: async (res) => {
      const tokens = res.data.data?.tokens;
      if (!tokens) {
        Alert.alert('Error', '2FA verification failed.');
        return;
      }

      const { accessToken, refreshToken } = tokens;
      await saveTokens(accessToken, refreshToken);
      await clearToken(CHALLENGE_TOKEN_KEY);
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
    },
  });
}
