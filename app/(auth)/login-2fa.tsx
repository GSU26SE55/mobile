import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { getToken } from '../../src/lib/secureStore';
import { useSend2faSms } from '../../src/features/auth/hooks/useSend2faSms';
import { useVerify2faLogin } from '../../src/features/auth/hooks/useVerify2faLogin';
import { CHALLENGE_TOKEN_KEY, Verify2faLoginPayload } from '../../src/features/auth/types/auth.types';
import { handleErrorApi } from '../../src/lib/errors';
import { Colors, Spacing } from '../../src/lib/theme';

// 3 mode loại trừ nhau — KHÔNG bao giờ gửi isBackupCode & isSmsCode cùng true (BE trả 400).
type Mode = 'totp' | 'backup' | 'sms';

const SUBTITLES: Record<Mode, string> = {
  totp: 'Nhập mã 6 số từ ứng dụng Authenticator.',
  backup: 'Nhập một backup code (xxxx-xxxx).',
  sms: 'Nhập mã 6 số đã gửi qua SMS.',
};

export default function Login2faScreen() {
  const insets = useSafeAreaInsets();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<Mode>('totp');
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [trustDevice, setTrustDevice] = useState(false);
  const [trustLabel, setTrustLabel] = useState('');

  const verify = useVerify2faLogin();
  const sendSms = useSend2faSms();

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getToken(CHALLENGE_TOKEN_KEY);
      if (!active) return;
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }
      setChallengeToken(token);
    })();
    return () => {
      active = false;
    };
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    setCode('');
  };

  const onSendSms = () => {
    if (!challengeToken) return;
    sendSms.mutate(
      { challengeToken },
      {
        onSuccess: (res) => {
          setMaskedPhone(res.data.data ?? null);
          switchMode('sms');
        },
        onError: (error) => handleErrorApi({ error }),
      },
    );
  };

  const onSubmit = () => {
    if (!challengeToken) return;
    const payload: Verify2faLoginPayload = {
      challengeToken,
      code,
      isBackupCode: mode === 'backup',
      isSmsCode: mode === 'sms',
    };
    // trust device chỉ áp dụng TOTP/SMS (server bỏ qua với backup code).
    if (mode !== 'backup' && trustDevice) {
      payload.trustDevice = true;
      const label = trustLabel.trim();
      if (label) payload.trustDeviceLabel = label;
    }
    verify.mutate(payload, { onError: (error) => handleErrorApi({ error }) });
  };

  const showTrust = mode !== 'backup';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.brand}>Xác thực 2 lớp</Text>
          <Text style={styles.subtitle}>{SUBTITLES[mode]}</Text>
          {mode === 'sms' && maskedPhone ? (
            <Text style={styles.smsHint}>Đã gửi tới số {maskedPhone}</Text>
          ) : null}
        </View>

        <View style={styles.formCard}>
          <TextInput
            autoFocus
            style={styles.input}
            keyboardType={mode === 'backup' ? 'default' : 'number-pad'}
            placeholder={mode === 'backup' ? 'abcd-2345' : '123456'}
            placeholderTextColor={Colors.textMute}
            value={code}
            onChangeText={(t) => setCode(mode === 'backup' ? t : t.replace(/\D/g, '').slice(0, 6))}
          />

          {showTrust && (
            <>
              <Pressable style={styles.trustRow} onPress={() => setTrustDevice((v) => !v)}>
                <Ionicons
                  name={trustDevice ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={trustDevice ? Colors.primary : Colors.textMute}
                />
                <Text style={styles.trustText}>Tin cậy thiết bị này (bỏ qua 2FA trong 30 ngày)</Text>
              </Pressable>
              {trustDevice && (
                <TextInput
                  style={styles.labelInput}
                  placeholder="Tên thiết bị (tuỳ chọn, vd: Điện thoại của tôi)"
                  placeholderTextColor={Colors.textMute}
                  maxLength={120}
                  value={trustLabel}
                  onChangeText={setTrustLabel}
                />
              )}
            </>
          )}

          <Pressable
            style={styles.submitBtn}
            onPress={onSubmit}
            disabled={verify.isPending || code.length === 0}
          >
            {verify.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Xác thực</Text>
            )}
          </Pressable>

          {mode !== 'sms' && (
            <Pressable onPress={onSendSms} disabled={sendSms.isPending}>
              {sendSms.isPending ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.toggle}>Không có Authenticator? Gửi mã qua SMS</Text>
              )}
            </Pressable>
          )}

          {mode !== 'backup' ? (
            <Pressable onPress={() => switchMode('backup')}>
              <Text style={styles.toggle}>Dùng backup code thay thế</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => switchMode('totp')}>
              <Text style={styles.toggle}>Dùng mã TOTP từ Authenticator</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brand: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
  smsHint: { fontSize: 13, color: Colors.primary, marginTop: 6, fontWeight: '600' },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    letterSpacing: 2,
    color: Colors.text,
    textAlign: 'center',
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trustText: { flex: 1, fontSize: 13, color: Colors.text },
  labelInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.text,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  toggle: { color: Colors.primary, fontSize: 14, textAlign: 'center', fontWeight: '500' },
});
