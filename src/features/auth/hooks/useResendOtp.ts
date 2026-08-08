import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { authService } from '../services/auth.service';
import { ResendOtpPayload } from '../types/auth.types';
import { handleErrorApi } from '@/src/lib/errors';

export function useResendOtp() {
  return useMutation({
    mutationFn: (data: ResendOtpPayload) => authService.resendOtp(data),
    onSuccess: () => {
      Alert.alert('Sent', 'A new OTP has been sent to your email.');
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
