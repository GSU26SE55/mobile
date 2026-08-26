import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { accountService } from '../services/account.service';
import type { Confirm2faPayload } from '../types/account.types';

// GH-295: 2FA enroll step 2 — verify TOTP → activate, returns 8 backup codes (one-time)
export function useConfirm2FA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Confirm2faPayload) => accountService.confirm2FA(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
    },
  });
}
