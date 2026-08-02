import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { authService } from '../services/auth.service';
import { ResendOtpPayload } from '../types/auth.types';
import { handleErrorApi } from '@/src/lib/errors';

export function useResendResetOtp() {
  return useMutation({
    mutationFn: (data: ResendOtpPayload) => authService.resendResetOtp(data),
    onSuccess: () => {
      Alert.alert('Đã gửi', 'OTP reset mật khẩu mới đã được gửi đến email của bạn.');
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
