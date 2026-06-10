import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useProfile } from '../../../src/features/profile/hooks/useProfile';
import { useEnable2FA } from '../../../src/features/account/hooks/useEnable2FA';
import { useDisable2FA } from '../../../src/features/account/hooks/useDisable2FA';
import { TwoFASetup } from '../../../src/features/account/components/TwoFASetup';
import { TwoFAEnableResponse } from '../../../src/features/account/types/account.types';
import { handleErrorApi } from '../../../src/lib/errors';
import { Colors } from '../../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TwoFAScreen() {
  const { data: account, isLoading } = useProfile();
  const enable2FA = useEnable2FA();
  const disable2FA = useDisable2FA();
  const [setupData, setSetupData] = useState<TwoFAEnableResponse | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (setupData) {
    return (
      <TwoFASetup
        secret={setupData.secret}
        otpAuthUri={setupData.otpAuthUri}
        onDisable={() =>
          disable2FA.mutate(undefined, {
            onSuccess: () => setSetupData(null),
            onError: (error) => handleErrorApi({ error }),
          })
        }
        isDisabling={disable2FA.isPending}
      />
    );
  }

  if (account?.twoFactorEnabled) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.container}>
        <View style={styles.iconContainerActive}>
          <Ionicons name="shield-checkmark" size={64} color={Colors.primary} />
        </View>
        <Text style={styles.status}>Xác thực 2 yếu tố (2FA) đang BẬT</Text>
        <Text style={styles.desc}>
          Tài khoản của bạn đang được bảo vệ bằng lớp bảo mật bổ sung. Mỗi lần đăng nhập sẽ yêu cầu mã OTP từ ứng dụng xác thực.
        </Text>
        <Pressable
          style={styles.disableBtn}
          onPress={() =>
            disable2FA.mutate(undefined, {
              onError: (error) => handleErrorApi({ error }),
            })
          }
          disabled={disable2FA.isPending}
        >
          {disable2FA.isPending ? (
            <ActivityIndicator color={Colors.danger} />
          ) : (
            <Text style={styles.disableText}>Tắt xác thực 2FA</Text>
          )}
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.iconContainerInactive}>
        <Ionicons name="shield-outline" size={64} color={Colors.gray} />
      </View>
      <Text style={styles.title}>Xác thực 2 yếu tố (2FA)</Text>
      <Text style={styles.desc}>
        Bảo vệ tài khoản của bạn bằng cách yêu cầu mã OTP từ ứng dụng Google Authenticator hoặc Authy khi đăng nhập.
      </Text>
      <Pressable
        style={styles.enableBtn}
        onPress={() =>
          enable2FA.mutate(undefined, {
            onSuccess: (res) => {
              if (res.data.data) setSetupData(res.data.data);
            },
            onError: (error) => handleErrorApi({ error }),
          })
        }
        disabled={enable2FA.isPending}
      >
        {enable2FA.isPending ? (
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
  container:   { padding: 24, alignItems: 'center' },
  iconContainerActive: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconContainerInactive: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  title:       { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 10, textAlign: 'center' },
  status:      { fontSize: 18, color: Colors.primary, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  desc:        { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 32 },
  enableBtn:   {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  enableText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  disableBtn:  {
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  disableText: { color: Colors.danger, fontSize: 15, fontWeight: '700' },
});
