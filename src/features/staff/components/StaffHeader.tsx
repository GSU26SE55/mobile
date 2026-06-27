import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../lib/theme';
import { useUnreadCount } from '../../notifications/hooks/useNotifications';
import { useStaffProfile } from '../hooks/useStaffProfile';

interface Props {
  showGreeting?: boolean;
  title?: string;
  subtitle?: string;
}

// Module-level: track which tab was active before opening notifications
let _prevTab = '/(staff)/dashboard';

export function StaffHeader({ showGreeting = false, title, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: profile } = useStaffProfile();

  const isOnNotifications = pathname.endsWith('/notifications');

  React.useEffect(() => {
    if (!isOnNotifications && pathname.includes('staff')) {
      _prevTab = pathname;
    }
  }, [isOnNotifications, pathname]);

  const handleBell = () => {
    if (isOnNotifications) {
      router.navigate(_prevTab as any);
    } else {
      router.navigate('/(staff)/notifications' as any);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        {showGreeting ? (
          <Text style={styles.name}>
            <Text style={styles.greeting}>Xin chào, </Text>
            {profile?.fullName ?? 'Staff'}
          </Text>
        ) : (
          <>
            <Text style={styles.pageTitle}>{title}</Text>
            {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
          </>
        )}
      </View>
      <Pressable style={styles.bell} onPress={handleBell} hitSlop={8}>
        <Ionicons
          name={isOnNotifications ? 'notifications' : 'notifications-outline'}
          size={22}
          color={isOnNotifications ? Colors.primary : Colors.text}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  left: { flex: 1 },
  greeting: { fontSize: 16, fontWeight: '500', color: Colors.textMute },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text },
  pageTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  subtitleText: { fontSize: 12, color: Colors.textMute, marginTop: 2 },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 7,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 11,
  },
});
