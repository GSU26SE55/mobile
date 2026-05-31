import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { accountService } from '../services/account.service';
import { clearTokens } from '../../../lib/secureStore';
import { useSessionStore } from '../../../stores/sessionStore';

export function useDeleteAccount() {
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: () => accountService.deleteAccount(),
    onSuccess: async () => {
      await clearTokens();
      clearSession();
      router.replace('/(auth)/login');
    },
  });
}
