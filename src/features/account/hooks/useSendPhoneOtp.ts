import { useMutation } from '@tanstack/react-query';
import { accountService } from '../services/account.service';

export function useSendPhoneOtp() {
  return useMutation({
    mutationFn: () => accountService.sendPhoneOtp(),
  });
}
