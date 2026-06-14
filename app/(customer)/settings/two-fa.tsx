import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../../src/features/profile/hooks/useProfile';
import { useInit2FA } from '../../../src/features/account/hooks/useInit2FA';
import { useConfirm2FA } from '../../../src/features/account/hooks/useConfirm2FA';
import { useDisable2FA } from '../../../src/features/account/hooks/useDisable2FA';
import { useRegenerateBackupCodes } from '../../../src/features/account/hooks/useRegenerateBackupCodes';
import { TwoFASetup } from '../../../src/features/account/components/TwoFASetup';
import { Init2faResponse } from '../../../src/features/account/types/account.types';
import { handleErrorApi } from '../../../src/lib/errors';
import { Colors } from '../../../src/lib/theme';

export default function TwoFAScreen() {
  const { data: account, isLoading } = useProfile();
  const init2FA = useInit2FA();
  const confirm2FA = useConfirm2FA();
  const disable2FA = useDisable2FA();
  const regen = useRegenerateBackupCodes();

  const [setupData, setSetupData] = useState<Init2faResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // disable form
  const [disableMode, setDisableMode] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableTotp, setDisableTotp] = useState('');

  // regenerate form
  const [regenMode, setRegenMode] = useState(false);
  const [regenTotp, setRegenTotp] = useState('');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  // Backup codes — hiển thị 1 lần (sau confirm hoặc regenerate)
  if (backupCodes) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.container}>
        <View style={styles.iconContainerActive}>
          <Ionicons name="key" size={56} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Backup codes</Text>
        <Text style={styles.warn}>⚠️ Lưu/in 8 mã này ngay — chỉ hiển thị 1 lần.</Text>
        <View style={styles.codesBox}>
          {backupCodes.map((c) => (
            <Text key={c} style={styles.codeText} selectable>{c}</Text>
          ))}
        </View>
        <Pressable style={styles.enableBtn} onPress={() => setBackupCodes(null)}>
          <Text style={styles.enableText}>Tôi đã lưu</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Enroll wizard — QR + nhập TOTP
  if (setupData) {
    return (
      <TwoFASetup
        secret={setupData.secret}
        otpAuthUri={setupData.otpAuthUri}
        isConfirming={confirm2FA.isPending}
        onCancel={() => setSetupData(null)}
        onConfirm={(code) =>
          confirm2FA.mutate(
            { pendingToken: setupData.pendingToken, code },
            {
              onSuccess: (res) => {
                const data = res.data.data;
                if (data?.enabled) {
                  setSetupData(null);
                  setBackupCodes(data.backupCodes);
                }
              },
              onError: (error) => handleErrorApi({ error }),
            },
          )
        }
      />
    );
  }

  // 2FA đang bật → disable / regenerate
  if (account?.twoFactorEnabled) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.container}>
        <View style={styles.iconContainerActive}>
          <Ionicons name="shield-checkmark" size={64} color={Colors.primary} />
        </View>
        <Text style={styles.status}>Xác thực 2 yếu tố (2FA) đang BẬT</Text>
        <Text style={styles.desc}>
          Mỗi lần đăng nhập sẽ yêu cầu mã OTP từ ứng dụng xác thực.
        </Text>

        {/* Regenerate backup codes */}
        {regenMode ? (
          <View style={styles.formBlock}>
            <Text style={styles.label}>Nhập mã TOTP để sinh lại backup codes</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor={Colors.textMute}
              maxLength={6}
              value={regenTotp}
              onChangeText={(t) => setRegenTotp(t.replace(/\D/g, '').slice(0, 6))}
            />
            <Pressable
              style={styles.enableBtn}
              disabled={regen.isPending || regenTotp.length !== 6}
              onPress={() =>
                regen.mutate(
                  { totpCode: regenTotp },
                  {
                    onSuccess: (res) => {
                      if (res.data.data) {
                        setRegenMode(false);
                        setRegenTotp('');
                        setBackupCodes(res.data.data.backupCodes);
                      }
                    },
                    onError: (error) => handleErrorApi({ error }),
                  },
                )
              }
            >
              {regen.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.enableText}>Sinh codes mới</Text>
              )}
            </Pressable>
            <Pressable onPress={() => { setRegenMode(false); setRegenTotp(''); }}>
              <Text style={styles.linkText}>Hủy</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.outlineBtn} onPress={() => setRegenMode(true)}>
            <Text style={styles.outlineText}>Sinh lại backup codes</Text>
          </Pressable>
        )}

        {/* Disable 2FA — password + TOTP */}
        {disableMode ? (
          <View style={styles.formBlock}>
            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Mật khẩu"
              placeholderTextColor={Colors.textMute}
              value={disablePassword}
              onChangeText={setDisablePassword}
            />
            <Text style={styles.label}>Mã TOTP</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor={Colors.textMute}
              maxLength={6}
              value={disableTotp}
              onChangeText={(t) => setDisableTotp(t.replace(/\D/g, '').slice(0, 6))}
            />
            <Pressable
              style={styles.disableBtn}
              disabled={disable2FA.isPending || !disablePassword || disableTotp.length !== 6}
              onPress={() =>
                disable2FA.mutate(
                  { password: disablePassword, totpCode: disableTotp },
                  {
                    onSuccess: () => {
                      setDisableMode(false);
                      setDisablePassword('');
                      setDisableTotp('');
                    },
                    onError: (error) => handleErrorApi({ error }),
                  },
                )
              }
            >
              {disable2FA.isPending ? (
                <ActivityIndicator color={Colors.danger} />
              ) : (
                <Text style={styles.disableText}>Xác nhận tắt 2FA</Text>
              )}
            </Pressable>
            <Pressable onPress={() => { setDisableMode(false); setDisablePassword(''); setDisableTotp(''); }}>
              <Text style={styles.linkText}>Hủy</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.disableBtn} onPress={() => setDisableMode(true)}>
            <Text style={styles.disableText}>Tắt xác thực 2FA</Text>
          </Pressable>
        )}
      </ScrollView>
    );
  }

  // 2FA chưa bật → init
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.iconContainerInactive}>
        <Ionicons name="shield-outline" size={64} color={Colors.gray} />
      </View>
      <Text style={styles.title}>Xác thực 2 yếu tố (2FA)</Text>
      <Text style={styles.desc}>
        Bảo vệ tài khoản bằng cách yêu cầu mã OTP từ Google Authenticator hoặc Authy khi đăng nhập.
      </Text>
      <Pressable
        style={styles.enableBtn}
        disabled={init2FA.isPending}
        onPress={() =>
          init2FA.mutate(undefined, {
            onSuccess: (res) => {
              if (res.data.data) setSetupData(res.data.data);
            },
            onError: (error) => handleErrorApi({ error }),
          })
        }
      >
        {init2FA.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.enableText}>Bật xác thực 2 yếu tố</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bg },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  container:   { padding: 24, alignItems: 'center', gap: 12 },
  iconContainerActive: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 8,
  },
  iconContainerInactive: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.card2,
    alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 8,
  },
  title:       { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  status:      { fontSize: 18, color: Colors.primary, fontWeight: '800', textAlign: 'center' },
  warn:        { fontSize: 13, color: Colors.danger, fontWeight: '600', textAlign: 'center' },
  desc:        { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 12 },
  codesBox:    { backgroundColor: Colors.card2, borderRadius: 12, padding: 16, width: '100%', gap: 6 },
  codeText:    { fontFamily: 'monospace', fontSize: 16, letterSpacing: 2, color: Colors.text, textAlign: 'center' },
  formBlock:   { width: '100%', gap: 10 },
  label:       { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  input:       {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, color: Colors.text,
  },
  enableBtn:   { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center' },
  enableText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineBtn:  { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center' },
  outlineText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  disableBtn:  { borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center' },
  disableText: { color: Colors.danger, fontSize: 15, fontWeight: '700' },
  linkText:    { color: Colors.textMute, fontSize: 14, textAlign: 'center', marginTop: 4 },
});
