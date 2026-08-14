import { Link } from 'expo-router';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginForm } from '@/src/features/auth/components/LoginForm';
import { GoogleSignInButton } from '@/src/features/auth/components/GoogleSignInButton';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
          />
          <Text style={styles.brand}>Solar Battery</Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <LoginForm />
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google login */}
        <View style={styles.googleSection}>
          <GoogleSignInButton />
        </View>

        {/* Footer links */}
        <View style={styles.footer}>
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don&apos;t have an account? </Text>
            <Link href="/(auth)/register" style={styles.registerLink}>
              Sign Up Now
            </Link>
          </View>

          <Link href="/(auth)/reactivate" style={styles.reactivateLink}>
            Restore a Deleted Account
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },

  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 72,
    height: 72,
    marginBottom: 8,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1C',
    letterSpacing: -0.5,
  },

  formSection: {
    marginBottom: 24,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  dividerText: {
    fontSize: 13,
    color: '#B0AEA6',
    fontWeight: '500',
  },

  googleSection: {
    marginBottom: 24,
  },

  footer: {
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#7A7872',
  },
  registerLink: {
    fontSize: 14,
    color: '#E0533C',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  reactivateLink: {
    fontSize: 13,
    color: '#B0AEA6',
    fontWeight: '500',
  },
});
