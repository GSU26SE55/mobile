import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useProfile } from '../../../src/features/profile/hooks/useProfile';
import { AvatarPicker } from '../../../src/features/profile/components/AvatarPicker';
import { useUploadAvatar } from '../../../src/features/profile/hooks/useUploadAvatar';
import { useLogout } from '../../../src/features/auth/hooks/useLogout';
import { handleErrorApi } from '../../../src/lib/errors';

export default function ProfileScreen() {
  const { data: account, isLoading } = useProfile();
  const uploadAvatar = useUploadAvatar();
  const logout = useLogout();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!account) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvatarPicker
        displayAvatarUrl={account.displayAvatarUrl}
        fullName={account.fullName}
        onPress={() =>
          uploadAvatar.mutate(undefined, {
            onError: (error) => handleErrorApi({ error }),
          })
        }
        isLoading={uploadAvatar.isPending}
      />

      <Text style={styles.name}>{account.fullName}</Text>
      <Text style={styles.role}>{account.role}</Text>
      <Text style={styles.email}>{account.email}</Text>

      <Pressable style={styles.btn} onPress={() => router.push('/(customer)/edit-profile')}>
        <Text style={styles.btnText}>Chỉnh sửa thông tin</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, styles.btnOutline]}
        onPress={() => router.push('/(customer)/settings')}
      >
        <Text style={[styles.btnText, styles.btnOutlineText]}>Cài đặt tài khoản</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, styles.btnLogout]}
        onPress={() => logout.mutate()}
        disabled={logout.isPending}
      >
        {logout.isPending ? (
          <ActivityIndicator color="#ef4444" />
        ) : (
          <Text style={[styles.btnText, styles.btnLogoutText]}>Đăng xuất</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container:    { padding: 24, alignItems: 'center', gap: 8 },
  name:         { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 12 },
  role:         { fontSize: 13, color: '#6366f1', fontWeight: '500' },
  email:        { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  btn:          {
    width: '100%', backgroundColor: '#6366f1',
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  btnOutline:    { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#6366f1' },
  btnLogout:     { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ef4444' },
  btnText:       { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnOutlineText: { color: '#6366f1' },
  btnLogoutText:  { color: '#ef4444' },
});
