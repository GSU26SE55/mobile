import { Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthContext } from '../../src/context/authContext';
import { useSessionStore } from '../../src/stores/sessionStore';

export default function StaffLayout() {
  const { isHydrating } = useAuthContext();
  const user = useSessionStore((s) => s.user);

  if (isHydrating) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user || user.role !== 'STAFF') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="tickets/[id]" />
      <Stack.Screen name="customers/[customerId]" />
      <Stack.Screen name="batteries/[id]" />
      <Stack.Screen name="alerts/index" />
      <Stack.Screen name="alerts/[id]" />
      <Stack.Screen name="incidents/[id]" />
      <Stack.Screen name="notification-preferences" />
      <Stack.Screen name="tools/index" />
      <Stack.Screen name="tools/battery-types/index" />
      <Stack.Screen name="tools/battery-types/[id]" />
      <Stack.Screen name="tools/calibration/index" />
      <Stack.Screen name="tools/calibration/create" />
      <Stack.Screen name="index" />
    </Stack>
  );
}
