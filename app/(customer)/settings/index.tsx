import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

const ITEMS = [
  { label: 'Đổi mật khẩu', route: '/(customer)/settings/change-password' as const },
  { label: 'Đổi email', route: '/(customer)/settings/change-email' as const },
  { label: 'Xác thực số điện thoại', route: '/(customer)/settings/phone-verify' as const },
  { label: 'Xác thực 2 yếu tố (2FA)', route: '/(customer)/settings/two-fa' as const },
  { label: 'Phiên đăng nhập', route: '/(customer)/settings/sessions' as const },
  { label: 'Thiết bị tin cậy', route: '/(customer)/settings/trusted-devices' as const },
  { label: 'Vùng nguy hiểm', route: '/(customer)/settings/danger-zone' as const },
];

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {ITEMS.map((item) => (
        <Pressable key={item.route} style={styles.item} onPress={() => router.push(item.route)}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  item:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  label:     { fontSize: 15, color: '#111827' },
  arrow:     { fontSize: 20, color: '#9ca3af' },
});
