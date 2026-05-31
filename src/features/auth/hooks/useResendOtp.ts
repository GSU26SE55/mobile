import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { authService } from '../services/auth.service';
import { ResendOtpPayload } from '../types/auth.types';
import { handleErrorApi } from '../../../lib/errors';

export function useResendOtp() {
  return useMutation({
    mutationFn: (data: ResendOtpPayload) => authService.resendOtp(data),
    onSuccess: () => {
      Alert.alert('Đã gửi', 'OTP mới đã được gửi đến email của bạn.');
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
