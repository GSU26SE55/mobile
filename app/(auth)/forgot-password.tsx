import { useState } from 'react';
import { Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ForgotPasswordStep1 } from '../../src/features/auth/components/ForgotPasswordStep1';
import { ForgotPasswordStep2 } from '../../src/features/auth/components/ForgotPasswordStep2';
import { ForgotPasswordStep3 } from '../../src/features/auth/components/ForgotPasswordStep3';

type Step = 1 | 2 | 3;

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState(0);

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
    2: 'Xác thực OTP',
    3: 'Đặt mật khẩu mới',
  };

  const stepHints: Record<Step, string> = {
    1: 'Nhập email để nhận mã OTP',
    2: 'Kiểm tra hộp thư của bạn',
    3: 'Tạo mật khẩu mới',
  };

  return (
    <SafeAreaView style={styles.flex}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepIndicator}>Bước {step}/3</Text>
        <Text style={styles.title}>{stepTitles[step]}</Text>
        <Text style={styles.subtitle}>{stepHints[step]}</Text>

        {step === 1 && <ForgotPasswordStep1 onSuccess={handleStep1Success} />}
        {step === 2 && (
          <ForgotPasswordStep2
            email={email}
            onSuccess={handleStep2Success}
          />
        )}
        {step === 3 && (
          <ForgotPasswordStep3
            resetToken={resetToken}
            expiresInSeconds={expiresInSeconds}
            onExpired={handleExpired}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: '#fff' },
  container:     { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 12 },
  stepIndicator: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  title:         { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  subtitle:      { fontSize: 14, color: '#666', marginBottom: 8 },
});
