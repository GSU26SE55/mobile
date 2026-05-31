import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthContext } from '../src/context/authContext';
import { useSessionStore } from '../src/stores/sessionStore';
import { redirectByRole } from '../src/types/session.types';
import { Redirect } from 'expo-router';

export default function IndexScreen() {
  const { isHydrating } = useAuthContext();
  const user = useSessionStore((s) => s.user);

  if (isHydrating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const dest = redirectByRole(user.role);
  if (!dest) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={dest as never} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
