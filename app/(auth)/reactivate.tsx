import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReactivateRequest } from '@/src/features/auth/hooks/useReactivateRequest';
import { useReactivateVerify } from '@/src/features/auth/hooks/useReactivateVerify';
import {
  reactivateRequestSchema,
  reactivateVerifySchema,
} from '@/src/features/auth/schemas/reactivate.schema';
import { handleErrorApi } from '@/src/lib/errors';
import { Colors } from '@/src/lib/theme';

type Step = 1 | 2;

export default function ReactivateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  
  const otpInputRef = useRef<TextInput>(null);

  const request = useReactivateRequest();
  const verify = useReactivateVerify();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onRequest = () => {
    setError(null);
    const parsed = reactivateRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid email');
      return;
    }
    request.mutate(parsed.data, {
      onSuccess: () => setStep(2),
      onError: (err) => handleErrorApi({ error: err }),
    });
  };

  const onVerify = () => {
    setError(null);
    const parsed = reactivateVerifySchema.safeParse({ email, otp });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid OTP');
      return;
    }
    verify.mutate(parsed.data, {
      onSuccess: () => {
        Alert.alert('Recovery successful', 'Your account has been recovered. Please sign in again.', [
          { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
        ]);
      },
      onError: (err) => handleErrorApi({ error: err }),
    });
  };

  const focusOtp = () => {
    otpInputRef.current?.focus();
  };

  // Internal step back: at step 2 (OTP entry), go back to step 1 keeping the email; only exit the screen at step 1.
  const handleBack = () => {
    if (step > 1) {
      setStep(1);
      setOtp('');
      setError(null);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
        <View style={styles.header}>
          <Text style={styles.title}>Recover account</Text>
          <Text style={styles.subtitle}>
            {step === 1 ? (
              'Enter the email of the deleted account (within 90 days) to receive a recovery code.'
            ) : (
              <>
                OTP sent to <Text style={styles.emailHighlight}>{email}</Text>
              </>
            )}
          </Text>
        </View>

        <View style={styles.formSection}>
          {step === 1 ? (
            <View style={styles.formFields}>
              <Text style={styles.label}>Account email</Text>
              <View style={[
                styles.inputRow,
                emailFocused && styles.inputRowFocused,
                error ? styles.inputRowError : null,
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.textFaint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
                {email.length > 0 && (
                  <Ionicons
                    name={isEmailValid ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={isEmailValid ? '#34C759' : Colors.textFaint}
                  />
                )}
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <Pressable
                style={({ pressed }) => [styles.submitBtn, (request.isPending || email.length === 0) && styles.submitBtnDisabled, pressed && styles.submitBtnPressed]}
                onPress={onRequest}
                disabled={request.isPending || email.length === 0}
              >
                {request.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Send recovery code</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.formFields}>
              {/* Hidden text input for OTP */}
              <TextInput
                ref={otpInputRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />

              {/* Visual OTP bubbles */}
              <Pressable style={styles.otpContainer} onPress={focusOtp}>
                {Array(6).fill(0).map((_, index) => {
                  const char = otp[index] || '';
                  const isFocused = index === otp.length;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.otpSlot,
                        isFocused && styles.otpSlotFocused,
                        error ? styles.otpSlotError : null,
                      ]}
                    >
                      <Text style={styles.otpText}>
                        {char || (isFocused ? '|' : '-')}
                      </Text>
                    </View>
                  );
                })}
              </Pressable>

              {error ? <Text style={[styles.errorText, { textAlign: 'center', marginTop: -4 }]}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [styles.submitBtn, (verify.isPending || otp.length < 6) && styles.submitBtnDisabled, pressed && styles.submitBtnPressed]}
                onPress={onVerify}
                disabled={verify.isPending || otp.length < 6}
              >
                {verify.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Recover account</Text>
                )}
              </Pressable>

              <Pressable onPress={() => { setStep(1); setOtp(''); setError(null); }} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>Use a different email</Text>
              </Pressable>
            </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  formFields: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1C',
    marginBottom: 8,
    marginLeft: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 54,
  },
  inputRowFocused: {
    borderColor: '#34C759',
  },
  inputRowError: {
    borderColor: Colors.danger,
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1C',
    paddingVertical: 0,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  otpSlot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  otpSlotFocused: {
    borderColor: '#34C759',
    backgroundColor: '#FFFFFF',
  },
  otpSlotError: {
    borderColor: Colors.danger,
    backgroundColor: '#FFF5F5',
  },
  otpText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1C',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginLeft: 16,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: '#34C759',
    borderRadius: 28,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  toggleBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  toggleText: {
    color: '#E0533C',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
