import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/auth.service';
import { OtpVerifyPayload } from '../types/auth.types';

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: OtpVerifyPayload) => authService.verifyOtp(data),
    onSuccess: () => {
      Alert.alert('Verification successful', 'Your account has been activated. Please sign in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    },
  });
}
