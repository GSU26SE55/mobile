import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatUnreadCount } from '@/src/features/tickets/hooks/useChatInbox';
import { Colors } from '@/src/lib/theme';

const ACCENT = '#FFD500';
const INK = '#1C1C1E';
const MUTED = '#9A968B';

const tabMeta: Record<string, {
  active: React.ComponentProps<typeof Ionicons>['name'];
  inactive: React.ComponentProps<typeof Ionicons>['name'];
}> = {
  dashboard: { active: 'home', inactive: 'home-outline' },
  tickets: { active: 'pie-chart', inactive: 'pie-chart-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  // Customer chat với Staff nằm trong tab Tickets, nên badge chưa đọc gắn vào tab đó.
  const { data: unreadChats = 0 } = useChatUnreadCount();

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomInset, height: 60 + bottomInset }]}>
      {state.routes.map((route: any, index: number) => {
        const options = descriptors[route.key]?.options;
        const meta = tabMeta[route.name];
        if (!meta || options?.href === null) return null;

        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
          >
            <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
              <Ionicons
                name={focused ? meta.active : meta.inactive}
                size={26}
                color={focused ? INK : MUTED}
              />
              {route.name === 'tickets' && unreadChats > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadChats > 99 ? '99+' : unreadChats}</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CustomerTabsLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="tickets" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="alerts" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(235,230,215,0.7)',
    shadowColor: '#8C7A4B',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: ACCENT,
    borderRadius: 18,
    shadowColor: '#D9A000',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  // Cùng kiểu badge với chuông thông báo ở HomeHeader để 2 chỗ đọc như một hệ thống.
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 7.5,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800', lineHeight: 11 },
});
