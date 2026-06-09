import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OtpVerifyForm } from '../../src/features/auth/components/OtpVerifyForm';
import { Colors, Spacing } from '../../src/lib/theme';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!email) router.replace('/(auth)/register');
  }, [email, router]);

  if (!email) return null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Xác thực email</Text>
          <Text style={styles.subtitle}>
            Chúng tôi đã gửi mã OTP đến email của bạn
          </Text>
        </View>

        <View style={styles.formCard}>
          <OtpVerifyForm email={email} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: Colors.bg },
  container:  { flex: 1, paddingHorizontal: Spacing.xxl },
  header:     { alignItems: 'center', marginBottom: Spacing.xxxl },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  title:      { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  formCard:   {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.xxl,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
});
