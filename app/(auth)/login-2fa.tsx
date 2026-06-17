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
import { useVerify2faLogin } from '../../src/features/auth/hooks/useVerify2faLogin';
import { CHALLENGE_TOKEN_KEY } from '../../src/features/auth/types/auth.types';
import { handleErrorApi } from '../../src/lib/errors';
import { Colors, Spacing } from '../../src/lib/theme';

export default function Login2faScreen() {
  const insets = useSafeAreaInsets();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const verify = useVerify2faLogin();

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

  const onSubmit = () => {
    if (!challengeToken) return;
    verify.mutate(
      { challengeToken, code, isBackupCode },
      { onError: (error) => handleErrorApi({ error }) },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.brand}>Xác thực 2 lớp</Text>
          <Text style={styles.subtitle}>
            {isBackupCode
              ? 'Nhập một backup code (xxxx-xxxx).'
              : 'Nhập mã 6 số từ ứng dụng Authenticator.'}
          </Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            autoFocus
            style={styles.input}
            keyboardType={isBackupCode ? 'default' : 'number-pad'}
            placeholder={isBackupCode ? 'abcd-2345' : '123456'}
            placeholderTextColor={Colors.textMute}
            value={code}
            onChangeText={(t) =>
              setCode(isBackupCode ? t : t.replace(/\D/g, '').slice(0, 6))
            }
          />

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

          <Pressable
            onPress={() => {
              setIsBackupCode((v) => !v);
              setCode('');
            }}
          >
            <Text style={styles.toggle}>
              {isBackupCode
                ? 'Dùng mã TOTP từ Authenticator'
                : 'Dùng backup code thay thế'}
            </Text>
          </Pressable>
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
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  toggle: { color: Colors.primary, fontSize: 14, textAlign: 'center', fontWeight: '500' },
});
