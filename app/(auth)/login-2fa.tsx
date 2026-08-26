import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getToken } from '@/src/lib/secureStore';
import { useSend2faSms } from '@/src/features/auth/hooks/useSend2faSms';
import { useVerify2faLogin } from '@/src/features/auth/hooks/useVerify2faLogin';
import { CHALLENGE_TOKEN_KEY, Verify2faLoginPayload } from '@/src/features/auth/types/auth.types';
import { handleErrorApi } from '@/src/lib/errors';
import { Colors } from '@/src/lib/theme';

// 3 mutually exclusive modes — NEVER send isBackupCode & isSmsCode both true (BE returns 400).
type Mode = 'totp' | 'backup' | 'sms';

const SUBTITLES: Record<Mode, string> = {
  totp: 'Enter the 6-digit code from your Authenticator app to continue.',
  backup: 'Enter a backup code in xxxx-xxxx format.',
  sms: 'Enter the 6-digit verification code sent via SMS.',
};

export default function Login2faScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<Mode>('totp');
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [trustDevice, setTrustDevice] = useState(false);
  const [trustLabel, setTrustLabel] = useState('');
  const [focused, setFocused] = useState(false);

  const otpInputRef = useRef<TextInput>(null);

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
    // Runs once on mount. expo-router's `router` is a stable singleton —
    // adding it to deps wouldn't change behavior, just muddy the "mount-only" intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // trust device only applies to TOTP/SMS (server ignores it for backup code).
    if (mode !== 'backup' && trustDevice) {
      payload.trustDevice = true;
      const label = trustLabel.trim();
      if (label) payload.trustDeviceLabel = label;
    }
    verify.mutate(payload, { onError: (error) => handleErrorApi({ error }) });
  };

  const focusOtp = () => {
    otpInputRef.current?.focus();
  };

  const showTrust = mode !== 'backup';
  const isOtpMode = mode === 'totp' || mode === 'sms';

  return (
    // keyboard-controller's KAV — RN's was disabled on Android (behavior undefined), so the
    // keyboard covered the OTP field / submit button there.
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      {/* Back button to go back to Login */}
      <Pressable onPress={() => router.replace('/(auth)/login')} style={[styles.backBtn, { top: insets.top + 16 }]}>
        <Ionicons name="chevron-back" size={20} color="#1A1A1C" />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 76, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Two-Factor Authentication</Text>
          <Text style={styles.subtitle}>{SUBTITLES[mode]}</Text>
          {mode === 'sms' && maskedPhone ? (
            <Text style={styles.smsHint}>Sent to {maskedPhone}</Text>
          ) : null}
        </View>

        <View style={styles.formSection}>
          {isOtpMode ? (
            <>
              {/* Hidden text input for OTP */}
              <TextInput
                ref={otpInputRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />

              {/* Visual OTP bubbles */}
              <Pressable style={styles.otpContainer} onPress={focusOtp}>
                {Array(6).fill(0).map((_, index) => {
                  const char = code[index] || '';
                  const isFocused = index === code.length;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.otpSlot,
                        isFocused && styles.otpSlotFocused,
                      ]}
                    >
                      <Text style={styles.otpText}>
                        {char || (isFocused ? '|' : '-')}
                      </Text>
                    </View>
                  );
                })}
              </Pressable>
            </>
          ) : (
            <View style={styles.inputFieldSection}>
              <Text style={styles.label}>Backup Code</Text>
              <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="xxxx-xxxx"
                  placeholderTextColor={Colors.textFaint}
                  autoCapitalize="none"
                  value={code}
                  onChangeText={setCode}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>
            </View>
          )}

          {showTrust && (
            <View style={styles.trustSection}>
              <Pressable style={styles.trustRow} onPress={() => setTrustDevice((v) => !v)}>
                <Ionicons
                  name={trustDevice ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={trustDevice ? '#34C759' : '#B0AEA6'}
                />
                <Text style={styles.trustText}>Trust this device for 30 days</Text>
              </Pressable>
              {trustDevice && (
                <View style={styles.inputFieldSection}>
                  <Text style={styles.label}>Device Name (optional)</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. My Phone"
                      placeholderTextColor={Colors.textFaint}
                      maxLength={120}
                      value={trustLabel}
                      onChangeText={setTrustLabel}
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.submitBtn, (verify.isPending || code.length === 0) && styles.submitBtnDisabled, pressed && styles.submitBtnPressed]}
            onPress={onSubmit}
            disabled={verify.isPending || code.length === 0}
          >
            {verify.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Verify</Text>
            )}
          </Pressable>

          <View style={styles.switchLinks}>
            {mode !== 'sms' && (
              <Pressable onPress={onSendSms} disabled={sendSms.isPending} style={styles.toggleBtn}>
                {sendSms.isPending ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <Text style={styles.toggleText}>Send Code via SMS</Text>
                )}
              </Pressable>
            )}

            {mode !== 'backup' ? (
              <Pressable onPress={() => switchMode('backup')} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>Use a Backup Code</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => switchMode('totp')} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>Use Authenticator App</Text>
              </Pressable>
            )}
          </View>
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
  smsHint: {
    fontSize: 14,
    color: '#34C759',
    marginTop: 8,
    fontWeight: '700',
  },
  formSection: {
    width: '100%',
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
    marginBottom: 24,
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
  otpText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1C',
  },
  inputFieldSection: {
    marginBottom: 16,
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
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1C',
    paddingVertical: 0,
  },
  trustSection: {
    marginBottom: 16,
    gap: 14,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  trustText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1C',
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
  switchLinks: {
    marginTop: 20,
    gap: 10,
    alignItems: 'center',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  toggleText: {
    color: '#E0533C',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
