import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../src/context/authContext';
import { notificationHref } from '../../src/features/notifications/lib/notificationHref';
import { notificationService } from '../../src/features/notifications/services/notification.service';
import { Colors } from '../../src/lib/theme';
import { useSessionStore } from '../../src/stores/sessionStore';

/** Entry point for taps on native local notifications. */
export default function NotificationRedirect() {
  const { notificationId, entityType, entityId, ticketId } = useLocalSearchParams<{
    notificationId?: string;
    entityType?: string;
    entityId?: string;
    ticketId?: string;
  }>();
  const { isHydrating } = useAuthContext();
  const role = useSessionStore((state) => state.user?.role);
  const routed = useRef(false);

  useEffect(() => {
    if (isHydrating || routed.current) return;
    routed.current = true;
    if (notificationId) void notificationService.markOpened(notificationId).catch(() => {});

    const href = notificationHref(entityType, entityId, role, ticketId);
    if (href) router.replace(href);
    else router.replace('/(auth)/login');
  }, [entityId, entityType, isHydrating, notificationId, role, ticketId]);

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
