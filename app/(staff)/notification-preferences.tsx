import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NotificationPreferencesForm } from '@/src/features/notifications/components/NotificationPreferencesForm';
import { ScreenHeader } from '@/src/shared/components/ScreenHeader';
import { Colors } from '@/src/lib/theme';

export default function StaffNotificationPreferencesScreen() {
  return (
    <View style={styles.root}>
      <ScreenHeader title="Cài đặt thông báo" />
      <NotificationPreferencesForm />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});
