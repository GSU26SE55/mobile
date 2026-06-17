import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, FadeIn, FadeOut, useSharedValue, interpolateColor } from 'react-native-reanimated';
import { Colors, ShadowLg } from '../../../src/lib/theme';

function AnimatedTabIcon({ focused, activeIcon, inactiveIcon, label }: { focused: boolean; activeIcon: any; inactiveIcon: any; label: string }) {
  const isFocusedSV = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    isFocusedSV.value = withTiming(focused ? 1 : 0, { duration: 250 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    const width = 44 + isFocusedSV.value * (110 - 44);
    const backgroundColor = interpolateColor(
      isFocusedSV.value,
      [0, 1],
      ['rgba(17, 24, 39, 0)', '#111827']
    );
    return { width, backgroundColor };
  });

  return (
    <Animated.View style={[styles.tabItemBase, animatedStyle]}>
      <Ionicons
        name={focused ? activeIcon : inactiveIcon}
        size={18}
        color={focused ? '#FFFFFF' : '#64748B'}
      />
      {focused && (
        <Animated.Text
          entering={FadeIn.delay(50).duration(200)}
          exiting={FadeOut.duration(100)}
          style={styles.tabLabel}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        if (options.href === null) return null;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        let activeIcon, inactiveIcon, label;
        if (route.name === 'dashboard')      { activeIcon = 'clipboard'; inactiveIcon = 'clipboard-outline'; label = 'Công việc'; }
        else if (route.name === 'notifications') { activeIcon = 'notifications'; inactiveIcon = 'notifications-outline'; label = 'Thông báo'; }
        else if (route.name === 'wiki')      { activeIcon = 'book'; inactiveIcon = 'book-outline'; label = 'Wiki'; }
        else if (route.name === 'profile')   { activeIcon = 'person-circle'; inactiveIcon = 'person-circle-outline'; label = 'Cá nhân'; }
        else return null;

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabButton}>
            <AnimatedTabIcon focused={isFocused} activeIcon={activeIcon} inactiveIcon={inactiveIcon} label={label} />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function StaffTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="wiki" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    alignSelf: 'center',
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 10,
    ...ShadowLg,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
});
