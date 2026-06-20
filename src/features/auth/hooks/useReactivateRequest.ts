import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { ReactivateRequestPayload } from '../types/auth.types';

// #AUTH-50: bước 1 — gửi OTP khôi phục account (luôn 200, anti-enumeration).
export function useReactivateRequest() {
  return useMutation({
    mutationFn: (data: ReactivateRequestPayload) => authService.reactivateRequest(data),
  });
}
