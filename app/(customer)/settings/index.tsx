import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Colors } from '@/src/lib/theme';

const ITEMS = [
  { label: 'Change password', route: '/(customer)/settings/change-password' as const },
  { label: 'Change email', route: '/(customer)/settings/change-email' as const },
  { label: 'Phone verification', route: '/(customer)/settings/phone-verify' as const },
  { label: 'Two-factor authentication (2FA)', route: '/(customer)/settings/two-fa' as const },
  { label: 'Login sessions', route: '/(customer)/settings/sessions' as const },
  { label: 'Trusted devices', route: '/(customer)/settings/trusted-devices' as const },
  { label: 'Notifications', route: '/(customer)/settings/notification-list' as const },
  { label: 'Notification settings', route: '/(customer)/settings/notifications' as const },
  { label: 'Chat inbox', route: '/(customer)/chats' as const },
  { label: 'Permission list', route: '/(customer)/settings/permissions' as const },
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
