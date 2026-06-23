import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../src/lib/theme';
import { NotificationList } from '../../../src/features/notifications/components/NotificationList';

export default function StaffNotificationsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Thông báo</Text>
      </View>

      <NotificationList
        ticketHref={(id) => ({ pathname: '/(staff)/tickets/[id]', params: { id } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
});
