import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 16 }]}>
        <Ionicons name="chevron-back" size={20} color="#1A1A1C" />
      </Pressable>

      <View style={[styles.container, { paddingTop: insets.top + 76 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Xác thực mã OTP</Text>
          <Text style={styles.subtitle}>
            Mã OTP đã gửi đến <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        </View>

        <View style={styles.formSection}>
          <OtpVerifyForm email={email} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1C',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#7A7872',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emailHighlight: {
    color: '#1A1A1C',
    fontWeight: '700',
  },
  formSection: {
    width: '100%',
  },
});
