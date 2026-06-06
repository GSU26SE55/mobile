import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthContext } from '../../src/context/authContext';
import { useSessionStore } from '../../src/stores/sessionStore';

export default function CustomerLayout() {
  const { isHydrating } = useAuthContext();
  const user = useSessionStore((s) => s.user);

  if (isHydrating) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user || user.role !== 'CUSTOMER') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tab group — headerShown: false để Tabs tự quản lý */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Stack screens — có header + back button */}
      <Stack.Screen name="edit-profile" options={{ headerShown: true, title: 'Chỉnh sửa thông tin', headerBackTitle: 'Quay lại' }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}
