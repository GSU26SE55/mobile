import { Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthContext } from '@/src/context/authContext';
import { useSessionStore } from '@/src/stores/sessionStore';
import { Colors } from '@/src/lib/theme';

export default function StaffLayout() {
  const { isHydrating } = useAuthContext();
  const user = useSessionStore((s) => s.user);

  if (isHydrating) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user || user.role !== 'STAFF') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
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
      <Stack.Screen name="tools/permissions" />
      <Stack.Screen name="chats/index" />
      <Stack.Screen name="chats/mentions" />
      {/* GH-78 — the 4 routes below already existed but were missing declarations until now. */}
      <Stack.Screen name="kb/index" />
      <Stack.Screen name="kb/[id]" />
      <Stack.Screen name="maintenance-history" />
      <Stack.Screen name="sites/[id]" />
      <Stack.Screen name="blog/index" />
      <Stack.Screen name="blog/[id]" />
      <Stack.Screen name="index" />
    </Stack>
  );
}
