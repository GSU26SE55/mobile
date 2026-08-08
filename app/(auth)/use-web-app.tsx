import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/lib/theme';

// ADMIN/MANAGER accounts don't use mobile — logging in with these roles (regular/2FA)
// redirects here instead of into the app. Symmetric with web (/use-mobile-app blocks CUSTOMER).
export default function UseWebAppScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="desktop-outline" size={34} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Please Use the Web App</Text>
        <Text style={styles.subtitle}>
          Admin and Manager accounts are managed through the web browser. The mobile
          app is for customers and staff.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.btnText}>Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1C',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMute,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    height: 54,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
