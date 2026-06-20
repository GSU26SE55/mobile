import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { ReactivateVerifyPayload } from '../types/auth.types';

// #AUTH-50: bước 2 — verify OTP. Thành công KHÔNG cấp token → caller redirect về /login.
export function useReactivateVerify() {
  return useMutation({
    mutationFn: (data: ReactivateVerifyPayload) => authService.reactivateVerify(data),
  });
}
