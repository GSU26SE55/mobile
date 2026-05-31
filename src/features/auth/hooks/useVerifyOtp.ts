import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { OtpVerifyPayload } from '../types/auth.types';

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: OtpVerifyPayload) => authService.verifyOtp(data),
    onSuccess: () => {
      Alert.alert('Xác thực thành công', 'Tài khoản đã được kích hoạt. Vui lòng đăng nhập.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    },
  });
}
