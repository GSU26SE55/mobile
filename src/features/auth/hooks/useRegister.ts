import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { RegisterPayload } from '../types/auth.types';

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterPayload) => authService.register(data),
    onSuccess: (res, variables) => {
      const body = res.data;
      if (!body.isSuccess) {
        Alert.alert('Đăng ký thất bại', body.message ?? 'Vui lòng thử lại.');
        return;
      }
      router.push({ pathname: '/(auth)/verify-otp', params: { email: variables.email } });
    },
    onError: () => {
      Alert.alert('Lỗi', 'Đăng ký thất bại. Vui lòng thử lại.');
    },
  });
}
