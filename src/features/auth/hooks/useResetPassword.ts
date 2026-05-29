import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { ResetPasswordPayload } from '../types/auth.types';

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordPayload) => authService.resetPassword(data),
    onSuccess: (res) => {
      const body = res.data;
      if (!body.isSuccess) {
        Alert.alert('Thất bại', body.message ?? 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
        return;
      }
      Alert.alert('Thành công', 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    },
    onError: () => {
      Alert.alert('Lỗi', 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    },
  });
}
