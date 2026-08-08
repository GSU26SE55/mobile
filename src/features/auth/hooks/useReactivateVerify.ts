import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { ReactivateVerifyPayload } from '../types/auth.types';

// #AUTH-50: step 2 — verify the OTP. On success, NO token is issued → caller redirects to /login.
export function useReactivateVerify() {
  return useMutation({
    mutationFn: (data: ReactivateVerifyPayload) => authService.reactivateVerify(data),
  });
}
