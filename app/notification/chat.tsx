import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../src/context/authContext';
import { notificationService } from '../../src/features/notifications/services/notification.service';
import { Colors } from '../../src/lib/theme';
import { useSessionStore } from '../../src/stores/sessionStore';

/** Native Android bubbles and ordinary push taps meet here before opening the ticket chat. */
export default function NotificationChatRedirect() {
  const { ticketId, notificationId } = useLocalSearchParams<{
    ticketId?: string;
    notificationId?: string;
  }>();
  const { isHydrating } = useAuthContext();
  const role = useSessionStore((state) => state.user?.role);
  const routed = useRef(false);

  useEffect(() => {
    if (isHydrating || routed.current) return;
    routed.current = true;

    if (notificationId) void notificationService.markOpened(notificationId).catch(() => {});

    if (!ticketId || (role !== 'CUSTOMER' && role !== 'STAFF')) {
      router.replace('/(auth)/login');
      return;
    }

    router.replace({
      pathname:
        role === 'CUSTOMER'
          ? '/(customer)/tickets/[id]'
          : '/(staff)/tickets/[id]',
      params: { id: ticketId, tab: 'chat' },
    });
  }, [isHydrating, notificationId, role, ticketId]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
});
