import { Stack } from 'expo-router';

// GH-68 — nhóm chat cross-ticket (inbox + mentions). Header dùng Stack (như settings/kb).
export default function ChatsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerBackTitle: 'Quay lại' }}>
      <Stack.Screen name="index" options={{ title: 'Hộp thư chat' }} />
      <Stack.Screen name="mentions" options={{ title: 'Nhắc đến tôi' }} />
    </Stack>
  );
}
