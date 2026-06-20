import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useSegments, useRouter } from 'expo-router';
import { useAuthContext } from '../context/authContext';
import { useSessionStore } from '../stores/sessionStore';
import { redirectByRole } from '../types/session.types';
import { clearTokens } from '../lib/secureStore';

export function useAuthGuard() {
  const { isHydrating } = useAuthContext();
  const user = useSessionStore((s) => s.user);
  const clearSession = useSessionStore((s) => s.clearSession);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isHydrating) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && inAuthGroup) {
      const dest = redirectByRole(user.role);
      if (!dest) {
        void (async () => {
          await clearTokens();
          clearSession();
          Alert.alert('Không hỗ trợ', 'Tài khoản này vui lòng dùng Web App.');
        })();
        return;
      }
      router.replace(dest as never);
    }
  }, [user, isHydrating, segments, router, clearSession]);
}
