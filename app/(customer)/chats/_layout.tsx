import { Stack } from 'expo-router';
import { BackButton } from '@/src/shared/components/ScreenHeader';

// GH-68 — nhóm chat cross-ticket (inbox + mentions). Header dùng Stack (như settings/kb).
// Nhóm này không được khai báo <Stack.Screen> ở (customer)/_layout nên render như
// root stack — không có screen để pop về, expo-router không tự vẽ back. Tự cấp headerLeft.
export default function ChatsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Quay lại',
        headerLeft: () => <BackButton variant="bare" />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Hộp thư chat' }} />
      <Stack.Screen name="mentions" options={{ title: 'Nhắc đến tôi' }} />
    </Stack>
  );
}
