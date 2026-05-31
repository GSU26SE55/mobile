import { Stack, Redirect } from 'expo-router';
import { useSessionStore } from '../../src/stores/sessionStore';

export default function StaffLayout() {
  const user = useSessionStore((s) => s.user);

  if (!user || user.role !== 'STAFF') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
