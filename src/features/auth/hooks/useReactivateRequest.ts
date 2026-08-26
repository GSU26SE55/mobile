import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { ReactivateRequestPayload } from '../types/auth.types';

// #AUTH-50: step 1 — send an OTP to reactivate the account (always 200, anti-enumeration).
export function useReactivateRequest() {
  return useMutation({
    mutationFn: (data: ReactivateRequestPayload) => authService.reactivateRequest(data),
  });
}
