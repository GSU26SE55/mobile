import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useProfile } from '../../../src/features/profile/hooks/useProfile';
import { useEnable2FA } from '../../../src/features/account/hooks/useEnable2FA';
import { useDisable2FA } from '../../../src/features/account/hooks/useDisable2FA';
import { TwoFASetup } from '../../../src/features/account/components/TwoFASetup';
import { TwoFAEnableResponse } from '../../../src/features/account/types/account.types';
import { handleErrorApi } from '../../../src/lib/errors';

export default function TwoFAScreen() {
  const { data: account, isLoading } = useProfile();
  const enable2FA = useEnable2FA();
  const disable2FA = useDisable2FA();
  const [setupData, setSetupData] = useState<TwoFAEnableResponse | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.status}>2FA đang bật ✓</Text>
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
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text style={styles.disableText}>Tắt 2FA</Text>
          )}
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.desc}>
        Bật xác thực 2 yếu tố để bảo vệ tài khoản của bạn tốt hơn.
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
          <Text style={styles.enableText}>Bật 2FA</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container:   { padding: 24, gap: 16 },
  status:      { fontSize: 16, color: '#16a34a', fontWeight: '600' },
  desc:        { fontSize: 15, color: '#374151', lineHeight: 22 },
  enableBtn:   {
    backgroundColor: '#6366f1', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  enableText:  { color: '#fff', fontSize: 15, fontWeight: '600' },
  disableBtn:  {
    borderWidth: 1, borderColor: '#ef4444', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  disableText: { color: '#ef4444', fontSize: 15, fontWeight: '500' },
});
