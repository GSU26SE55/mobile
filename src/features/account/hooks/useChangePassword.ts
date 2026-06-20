import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { accountService } from '../services/account.service';
import { ChangePasswordPayload } from '../types/account.types';
import { clearTokens } from '../../../lib/secureStore';
import { useSessionStore } from '../../../stores/sessionStore';

export function useChangePassword() {
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: (data: ChangePasswordPayload) => accountService.changePassword(data),
    onSuccess: async () => {
      await clearTokens();
      clearSession();
      router.replace('/(auth)/login');
    },
  });
}
