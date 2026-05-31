import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { authService } from '../services/auth.service';
import { ResendOtpPayload } from '../types/auth.types';

export function useResendResetOtp() {
  return useMutation({
    mutationFn: (data: ResendOtpPayload) => authService.resendResetOtp(data),
    onSuccess: (res) => {
      const body = res.data;
      if (!body.isSuccess) {
        Alert.alert('Gửi lại thất bại', body.message ?? 'Vui lòng thử lại sau.');
        return;
      }
      Alert.alert('Đã gửi', 'OTP reset mật khẩu mới đã được gửi đến email của bạn.');
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể gửi lại OTP. Vui lòng thử lại.');
    },
  });
}
