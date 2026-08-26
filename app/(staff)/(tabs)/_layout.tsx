import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PressableScale } from '@/src/shared/components/motion';
import { useTabTransition } from '@/src/hooks/useScreenTransition';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
          <PressableScale
            key={route.key}
            onPress={onPress}
            scaleTo={0.88}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            style={styles.tabButton}
          >
            <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
              <Ionicons
                name={focused ? meta.active : meta.inactive}
                size={26}
                color={focused ? INK : MUTED}
              />
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

export default function StaffTabsLayout() {
  const tabTransition = useTabTransition();
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, ...tabTransition }}
    >
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
  iconBoxActive: {
    backgroundColor: ACCENT,
    borderRadius: 18,
    shadowColor: '#D9A000',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
