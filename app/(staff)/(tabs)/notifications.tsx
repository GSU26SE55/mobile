import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../../src/lib/theme';
import { NotificationList } from '../../../src/features/notifications/components/NotificationList';
import { StaffHeader } from '../../../src/features/staff/components/StaffHeader';

export default function StaffNotificationsScreen() {
  return (
    <View style={styles.root}>
      <StaffHeader title="Thông báo" />
      <NotificationList
        ticketHref={(id) => ({ pathname: '/(staff)/tickets/[id]', params: { id } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});
