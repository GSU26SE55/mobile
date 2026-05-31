import { Tabs, Redirect } from 'expo-router';
import { useSessionStore } from '../../src/stores/sessionStore';

export default function CustomerLayout() {
  const user = useSessionStore((s) => s.user);

  if (!user || user.role !== 'CUSTOMER') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Tổng quan' }} />
    </Tabs>
  );
}
