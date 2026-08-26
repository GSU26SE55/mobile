import { Stack } from 'expo-router';
import { useStackTransition } from '@/src/hooks/useScreenTransition';

export default function AuthLayout() {
  const screenOptions = useStackTransition();
  return (
    <Stack
      screenOptions={{ ...screenOptions, contentStyle: { backgroundColor: '#FFFFFF' } }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="login-2fa" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reactivate" />
      <Stack.Screen name="use-web-app" />
    </Stack>
  );
}
