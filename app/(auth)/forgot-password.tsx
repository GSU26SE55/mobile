import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ForgotPasswordStep1 } from '../../src/features/auth/components/ForgotPasswordStep1';
import { ForgotPasswordStep2 } from '../../src/features/auth/components/ForgotPasswordStep2';
import { ForgotPasswordStep3 } from '../../src/features/auth/components/ForgotPasswordStep3';
import { Colors, Spacing } from '../../src/lib/theme';

type Step = 1 | 2 | 3;

const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  1: 'mail-outline',
  2: 'keypad-outline',
  3: 'lock-closed-outline',
};

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleStep1Success = (resolvedEmail: string) => {
    setEmail(resolvedEmail);
    setStep(2);
  };

  const handleStep2Success = (token: string, expires: number) => {
    setResetToken(token);
    setExpiresInSeconds(expires);
    setStep(3);
  };

  const handleExpired = () => {
    setStep(1);
    setEmail('');
    setResetToken('');
    setExpiresInSeconds(0);
  };

  const stepTitles: Record<Step, string> = {
    1: 'Quên mật khẩu',
    2: 'Nhập mã OTP',
    3: 'Mật khẩu mới',
  };

  const stepHints: Record<Step, string> = {
    1: 'Nhập email để nhận mã xác thực',
    2: 'Kiểm tra hộp thư email của bạn',
    3: 'Tạo mật khẩu mới cho tài khoản',
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          <Text style={styles.backText}>Quay lại</Text>
        </Pressable>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {([1, 2, 3] as Step[]).map((s) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, s <= step && styles.stepDotActive]}>
                {s < step ? (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                ) : (
                  <Text style={[styles.stepNum, s <= step && styles.stepNumActive]}>{s}</Text>
                )}
              </View>
              {s < 3 && <View style={[styles.stepLine, s < step && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name={STEP_ICONS[step]} size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{stepTitles[step]}</Text>
          <Text style={styles.subtitle}>{stepHints[step]}</Text>
        </View>

        <View style={styles.formCard}>
          {step === 1 && <ForgotPasswordStep1 onSuccess={handleStep1Success} />}
          {step === 2 && (
            <ForgotPasswordStep2 email={email} onSuccess={handleStep2Success} />
          )}
          {step === 3 && (
            <ForgotPasswordStep3
              resetToken={resetToken}
              expiresInSeconds={expiresInSeconds}
              onExpired={handleExpired}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: Colors.bg },
  container:      { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
  backBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xl, paddingVertical: 4 },
  backText:       { color: Colors.primary, fontSize: 15, fontWeight: '500' },
  stepRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxl },
  stepItem:       { flexDirection: 'row', alignItems: 'center' },
  stepDot:        {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive:  { backgroundColor: Colors.primary },
  stepNum:        { fontSize: 13, fontWeight: '600', color: Colors.textTertiary },
  stepNumActive:  { color: Colors.white },
  stepLine:       { width: 40, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.primary },
  header:         { alignItems: 'center', marginBottom: Spacing.xxl },
  iconCircle:     {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  title:          { fontSize: 22, fontWeight: '700', color: Colors.text },
  subtitle:       { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  formCard:       {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.xxl,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
});
