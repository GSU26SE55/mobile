import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useReactivateRequest } from '../../src/features/auth/hooks/useReactivateRequest';
import { useReactivateVerify } from '../../src/features/auth/hooks/useReactivateVerify';
import {
  reactivateRequestSchema,
  reactivateVerifySchema,
} from '../../src/features/auth/schemas/reactivate.schema';
import { handleErrorApi } from '../../src/lib/errors';
import { Colors, Spacing } from '../../src/lib/theme';

type Step = 1 | 2;

export default function ReactivateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const request = useReactivateRequest();
  const verify = useReactivateVerify();

  const onRequest = () => {
    setError(null);
    const parsed = reactivateRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Email không hợp lệ');
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
      setError(parsed.error.issues[0]?.message ?? 'OTP không hợp lệ');
      return;
    }
    verify.mutate(parsed.data, {
      onSuccess: () => {
        Alert.alert('Khôi phục thành công', 'Tài khoản đã được khôi phục. Vui lòng đăng nhập lại.', [
          { text: 'Đăng nhập', onPress: () => router.replace('/(auth)/login') },
        ]);
      },
      onError: (err) => handleErrorApi({ error: err }),
    });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          <Text style={styles.backText}>Quay lại</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name={step === 1 ? 'refresh-outline' : 'keypad-outline'} size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Khôi phục tài khoản</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Nhập email của tài khoản đã xóa (trong vòng 90 ngày) để nhận mã khôi phục.'
              : 'Nhập mã OTP 6 số đã gửi tới email của bạn.'}
          </Text>
        </View>

        <View style={styles.formCard}>
          {step === 1 ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textMute}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Pressable
                style={styles.submitBtn}
                onPress={onRequest}
                disabled={request.isPending || email.length === 0}
              >
                {request.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Gửi mã khôi phục</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                autoFocus
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor={Colors.textMute}
                keyboardType="number-pad"
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Pressable
                style={styles.submitBtn}
                onPress={onVerify}
                disabled={verify.isPending || otp.length === 0}
              >
                {verify.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Khôi phục tài khoản</Text>
                )}
              </Pressable>
              <Pressable onPress={() => { setStep(1); setOtp(''); setError(null); }}>
                <Text style={styles.toggle}>Đổi email khác</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: Colors.bg },
  container:  { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xl, paddingVertical: 4 },
  backText:   { color: Colors.primary, fontSize: 15, fontWeight: '500' },
  header:     { alignItems: 'center', marginBottom: Spacing.xxl },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  title:      { fontSize: 22, fontWeight: '700', color: Colors.text },
  subtitle:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, maxWidth: 300, lineHeight: 20 },
  formCard:   {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.xxl, gap: Spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: Colors.text,
  },
  otpInput:   { fontSize: 18, letterSpacing: 2, textAlign: 'center' },
  errorText:  { fontSize: 12, color: Colors.danger, marginTop: -8 },
  submitBtn:  { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  toggle:     { color: Colors.primary, fontSize: 14, textAlign: 'center', fontWeight: '500' },
});
