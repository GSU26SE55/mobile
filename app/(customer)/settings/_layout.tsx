import { Stack } from 'expo-router';
import { BackButton } from '@/src/shared/components/ScreenHeader';

// Nhóm settings không được khai báo <Stack.Screen> ở (customer)/_layout nên nó
// render như một root stack — expo-router không có screen nào để pop về, do đó
// không tự vẽ nút back. Tự cấp headerLeft cho cả nhóm để mọi screen đều quay lại được.
export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Quay lại',
        headerLeft: () => <BackButton variant="bare" />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Cài đặt tài khoản' }} />
      <Stack.Screen name="change-password" options={{ title: 'Đổi mật khẩu' }} />
      <Stack.Screen name="change-email" options={{ title: 'Đổi email' }} />
      <Stack.Screen name="phone-verify" options={{ title: 'Xác thực SĐT' }} />
      <Stack.Screen name="two-fa" options={{ title: 'Xác thực 2 yếu tố' }} />
      <Stack.Screen name="sessions" options={{ title: 'Phiên đăng nhập' }} />
      <Stack.Screen name="trusted-devices" options={{ title: 'Thiết bị tin cậy' }} />
      <Stack.Screen name="notification-list" options={{ title: 'Thông báo' }} />
      <Stack.Screen name="notifications" options={{ title: 'Cài đặt thông báo' }} />
      <Stack.Screen name="permissions" options={{ title: 'Danh mục quyền' }} />
      <Stack.Screen name="danger-zone" options={{ title: 'Vùng nguy hiểm' }} />
    </Stack>
  );
}
