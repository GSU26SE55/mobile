import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Quay lại',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Cài đặt tài khoản' }} />
      <Stack.Screen name="change-password" options={{ title: 'Đổi mật khẩu' }} />
      <Stack.Screen name="change-email" options={{ title: 'Đổi email' }} />
      <Stack.Screen name="phone-verify" options={{ title: 'Xác thực SĐT' }} />
      <Stack.Screen name="two-fa" options={{ title: 'Xác thực 2 yếu tố' }} />
      <Stack.Screen name="sessions" options={{ title: 'Phiên đăng nhập' }} />
      <Stack.Screen name="trusted-devices" options={{ title: 'Thiết bị tin cậy' }} />
      <Stack.Screen name="danger-zone" options={{ title: 'Vùng nguy hiểm' }} />
    </Stack>
  );
}
