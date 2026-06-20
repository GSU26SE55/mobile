import { Stack } from 'expo-router';
import { Colors } from '../../src/lib/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="login-2fa" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reactivate" />
    </Stack>
  );
}
