import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { RegisterPayload } from '../types/auth.types';

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterPayload) => authService.register(data),
    onSuccess: (_res, variables) => {
      router.push({ pathname: '/(auth)/verify-otp', params: { email: variables.email } });
    },
  });
}
