import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { ResetPasswordPayload } from '../types/auth.types';

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordPayload) => authService.resetPassword(data),
    onSuccess: () => {
      Alert.alert('Success', 'Your password has been reset. Please sign in again.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    },
  });
}
