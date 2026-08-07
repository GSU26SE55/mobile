import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { accountService } from '../services/account.service';
import { ConfirmEmailChangePayload } from '../types/account.types';
import { clearTokens } from '@/src/lib/secureStore';
import { useSessionStore } from '@/src/stores/sessionStore';

export function useConfirmEmailChange() {
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: (data: ConfirmEmailChangePayload) => accountService.confirmEmailChange(data),
    onSuccess: async () => {
      await clearTokens();
      clearSession();
      router.replace('/(auth)/login');
    },
  });
}
