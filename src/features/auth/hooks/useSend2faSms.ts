import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { Sms2faPayload } from '../types/auth.types';

// #AUTH-58: sends the OTP via SMS — returns the masked phone number ("******1234") for display.
export function useSend2faSms() {
  return useMutation({
    mutationFn: (data: Sms2faPayload) => authService.send2faSms(data),
  });
}
