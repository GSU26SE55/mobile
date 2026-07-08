import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Colors } from '../../../src/lib/theme';

const ITEMS = [
  { label: 'Đổi mật khẩu', route: '/(customer)/settings/change-password' as const },
  { label: 'Đổi email', route: '/(customer)/settings/change-email' as const },
  { label: 'Xác thực số điện thoại', route: '/(customer)/settings/phone-verify' as const },
  { label: 'Xác thực 2 yếu tố (2FA)', route: '/(customer)/settings/two-fa' as const },
  { label: 'Phiên đăng nhập', route: '/(customer)/settings/sessions' as const },
  { label: 'Thiết bị tin cậy', route: '/(customer)/settings/trusted-devices' as const },
  { label: 'Thông báo', route: '/(customer)/settings/notification-list' as const },
  { label: 'Cài đặt thông báo', route: '/(customer)/settings/notifications' as const },
  { label: 'Hộp thư chat', route: '/(customer)/chats' as const },
  { label: 'Danh mục quyền', route: '/(customer)/settings/permissions' as const },
  { label: 'Vùng nguy hiểm', route: '/(customer)/settings/danger-zone' as const },
];

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {ITEMS.map((item) => (
        <Pressable key={item.route} style={styles.item} onPress={() => router.push(item.route)}>
          <Text style={styles.label}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />
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
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  label:     { fontSize: 15, color: Colors.text },
});
