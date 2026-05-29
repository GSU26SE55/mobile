import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { authService } from '../services/auth.service';
import { ForgotPasswordPayload } from '../types/auth.types';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordPayload) => authService.forgotPassword(data),
    onSuccess: (res) => {
      const body = res.data;
      if (!body.isSuccess) {
        Alert.alert('Thất bại', body.message ?? 'Email không tồn tại trong hệ thống.');
      }
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    },
  });
}
