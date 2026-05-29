import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { OtpVerifyPayload } from '../types/auth.types';

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: OtpVerifyPayload) => authService.verifyOtp(data),
    onSuccess: (res) => {
      const body = res.data;
      if (!body.isSuccess) {
        Alert.alert('OTP không hợp lệ', body.message ?? 'Vui lòng thử lại.');
        return;
      }
      Alert.alert('Xác thực thành công', 'Tài khoản đã được kích hoạt. Vui lòng đăng nhập.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    },
    onError: () => {
      Alert.alert('Lỗi', 'Xác thực OTP thất bại. Vui lòng thử lại.');
    },
  });
}
