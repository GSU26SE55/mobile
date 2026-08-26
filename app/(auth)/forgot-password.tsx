import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ForgotPasswordStep1 } from '@/src/features/auth/components/ForgotPasswordStep1';
import { ForgotPasswordStep2 } from '@/src/features/auth/components/ForgotPasswordStep2';
import { ForgotPasswordStep3 } from '@/src/features/auth/components/ForgotPasswordStep3';

type Step = 1 | 2 | 3;

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

  // Internal step back: at step 2/3, go back one step (keep progress); only exit the screen at step 1.
  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    } else {
      router.back();
    }
  };

  const stepTitles: Record<Step, string> = {
    1: 'Forgot password',
    2: 'Enter OTP',
    3: 'New password',
  };

  const stepHints: Record<Step, string> = {
    1: 'Enter your email to receive a password reset code',
    2: 'Check your email inbox',
    3: 'Create a new password for your account',
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Back button */}
      <Pressable
        onPress={handleBack}
        style={[styles.backBtn, { top: insets.top + 16 }]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={20} color="#1A1A1C" />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 76, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View style={styles.stepRow}>
          {([1, 2, 3] as Step[]).map((s) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, s <= step && styles.stepDotActive]}>
                {s < step ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepNum, s <= step && styles.stepNumActive]}>{s}</Text>
                )}
              </View>
              {s < 3 && <View style={[styles.stepLine, s < step && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{stepTitles[step]}</Text>
          <Text style={styles.subtitle}>
            {step === 2 ? (
              <>
                OTP sent to <Text style={styles.emailHighlight}>{email}</Text>
              </>
            ) : (
              stepHints[step]
            )}
          </Text>
        </View>

        <View style={styles.formSection}>
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
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#34C759',
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A7872',
  },
  stepNumActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#EBEBEB',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#34C759',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1C',
  },
  subtitle: {
    fontSize: 14,
    color: '#7A7872',
    textAlign: 'center',
    marginTop: 6,
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
