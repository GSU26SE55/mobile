import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { accountService } from '../services/account.service';
import type { Disable2faPayload } from '../types/account.types';

// GH-295: disable 2FA — re-auth with password + TOTP
export function useDisable2FA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Disable2faPayload) => accountService.disable2FA(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
    },
  });
}
