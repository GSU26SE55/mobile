import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { ResetPasswordPayload } from '../types/auth.types';

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordPayload) => authService.resetPassword(data),
    onSuccess: () => {
      Alert.alert('Thành công', 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    },
  });
}
