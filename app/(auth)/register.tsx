import { Link } from 'expo-router';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RegisterForm } from '@/src/features/auth/components/RegisterForm';
import { BackButton } from '@/src/shared/components/ScreenHeader';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Back button */}
      <BackButton />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 76, paddingBottom: insets.bottom + 24 }]}
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
          <RegisterForm />
        </View>

        {/* TODO(BE): Google OAuth has no backend yet — hide the button instead of leaving a dead-end. */}

        {/* Footer */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Log In
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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

  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  loginText: {
    color: '#7A7872',
    fontSize: 14,
  },
  link: {
    color: '#E0533C',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
