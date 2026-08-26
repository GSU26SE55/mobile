import { Redirect, Stack } from 'expo-router';
import { useModalTransition, useStackTransition } from '@/src/hooks/useScreenTransition';
import { ActivityIndicator, View } from 'react-native';
import { useAuthContext } from '@/src/context/authContext';
import { useSessionStore } from '@/src/stores/sessionStore';
import { Colors } from '@/src/lib/theme';

export default function CustomerLayout() {
  const screenOptions = useStackTransition();
  const modalOptions = useModalTransition();
  const { isHydrating } = useAuthContext();
  const user = useSessionStore((s) => s.user);

  if (isHydrating) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user || user.role !== 'CUSTOMER') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: true,
          title: 'Edit Information',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.primary,
          headerTitleStyle: { fontWeight: '600', color: Colors.text },
        }}
      />
      <Stack.Screen name="blog" options={{ headerShown: false }} /> {/* GH-78 */}
      {/* Task flow, not a drill-down — rising from the bottom means dismissing it
          does not read as losing your place in the ticket list. */}
      <Stack.Screen name="tickets/create" options={modalOptions} />
    </Stack>
  );
}
