import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { Sms2faPayload } from '../types/auth.types';

// #AUTH-58: gửi OTP qua SMS — trả về số điện thoại đã mask ("******1234") để hiển thị.
export function useSend2faSms() {
  return useMutation({
    mutationFn: (data: Sms2faPayload) => authService.send2faSms(data),
  });
}
