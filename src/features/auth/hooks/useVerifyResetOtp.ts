import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { VerifyResetOtpPayload } from '../types/auth.types';

export function useVerifyResetOtp() {
  return useMutation({
    mutationFn: (data: VerifyResetOtpPayload) => authService.verifyResetOtp(data),
  });
}
