import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatUnreadCount } from '@/src/features/tickets/hooks/useChatInbox';

const ACCENT = '#FFD500';
const INK = '#1C1C1E';
const MUTED = '#9A968B';

const tabMeta: Record<
  string,
  {
    active: React.ComponentProps<typeof Ionicons>['name'];
    inactive: React.ComponentProps<typeof Ionicons>['name'];
  }
> = {
  dashboard: { active: 'clipboard', inactive: 'clipboard-outline' },
  customers: { active: 'people', inactive: 'people-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  // Total unread messages — BE counts by chat row so messages with @mention are already
  // included in this count, do NOT add the mention list on top (would double-count the same message).
  const { data: unread = 0 } = useChatUnreadCount();

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
              {route.name === 'customers' && unread > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unread > 99 ? '99+' : unread}</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function StaffTabsLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="profile" />
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
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tabBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  iconBoxActive: {
    backgroundColor: ACCENT,
    borderRadius: 18,
    shadowColor: '#D9A000',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
});
