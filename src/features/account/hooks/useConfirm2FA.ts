import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { accountService } from '../services/account.service';
import type { Confirm2faPayload } from '../types/account.types';

// GH-295: bước 2 enroll 2FA — verify TOTP → activate, trả 8 backup codes (1 lần)
export function useConfirm2FA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Confirm2faPayload) => accountService.confirm2FA(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
    },
  });
}
