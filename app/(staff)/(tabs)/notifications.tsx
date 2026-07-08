import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Shadow } from '../../../src/lib/theme';
import { NotificationList } from '../../../src/features/notifications/components/NotificationList';
import { StaffHeader } from '../../../src/features/staff/components/StaffHeader';

export default function StaffNotificationsScreen() {
  return (
    <View style={styles.root}>
      <StaffHeader title="Thông báo" />

      {/* GH-55 — entry vào màn Cảnh báo & Sự cố */}
      <Pressable
        style={[styles.entry, Shadow]}
        onPress={() => router.push('/(staff)/alerts')}
      >
        <View style={styles.entryIcon}>
          <Ionicons name="warning-outline" size={20} color="#DC4F3D" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.entryTitle}>Cảnh báo & Sự cố</Text>
          <Text style={styles.entryMeta}>Xem và xử lý cảnh báo pin, sự cố môi trường</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMute} />
      </Pressable>

      <NotificationList
        ticketHref={(id) => ({ pathname: '/(staff)/tickets/[id]', params: { id } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFEBEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  entryTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  entryMeta: { fontSize: 11, color: Colors.textMute, marginTop: 3 },
});
