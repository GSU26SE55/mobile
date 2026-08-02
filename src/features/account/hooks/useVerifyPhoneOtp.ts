import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { accountService } from '../services/account.service';
import { PhoneOtpPayload } from '../types/account.types';

export function useVerifyPhoneOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PhoneOtpPayload) => accountService.verifyPhoneOtp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
    },
  });
}
