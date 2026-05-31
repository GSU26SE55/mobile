import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { authService } from '../services/auth.service';
import { VerifyResetOtpPayload } from '../types/auth.types';

export function useVerifyResetOtp() {
  return useMutation({
    mutationFn: (data: VerifyResetOtpPayload) => authService.verifyResetOtp(data),
    onSuccess: (res) => {
      const body = res.data;
      if (!body.isSuccess) {
        Alert.alert('OTP không hợp lệ', body.message ?? 'Vui lòng kiểm tra lại.');
      }
    },
    onError: () => {
      Alert.alert('Lỗi', 'Xác thực OTP thất bại. Vui lòng thử lại.');
    },
  });
}
