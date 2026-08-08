import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/src/lib/theme';
import { useSessionStore } from '@/src/stores/sessionStore';

interface BackButtonProps {
  /** Overrides back behavior (default: pop, falls back to the root tab if pop isn't possible). */
  onPress?: () => void;
  /** `bare` = chevron only, no background — used for the Stack's headerLeft. */
  variant?: 'card' | 'bare';
}

/**
 * SHARED back button for the whole app — every screen must use this one,
 * not build its own Pressable + chevron (previously each screen had its own
 * size 18/22/26 and different hitSlop).
 *
 * `canGoBack()` guard: entering directly via deep-link (push notification) leaves
 * the stack empty, so `router.back()` would no-op and the button would be dead —
 * hence the fallback to the root tab based on role.
 */
export function BackButton({ onPress, variant = 'card' }: BackButtonProps) {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    const role = useSessionStore.getState().user?.role;
    router.replace(role === 'STAFF' ? '/(staff)/(tabs)/dashboard' : '/(customer)/(tabs)/dashboard');
  };

  return (
    <Pressable
      onPress={onPress ?? goBack}
      hitSlop={8}
      style={({ pressed }) => [
        variant === 'card' ? styles.btn : styles.btnBare,
        variant === 'card' && Shadow,
        pressed && { opacity: 0.6 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={variant === 'card' ? 18 : 26} color={Colors.text} />
    </Pressable>
  );
}

interface Props {
  title: string;
  /** Overrides the back button behavior (default router.back()). */
  onBack?: () => void;
  /** Optional secondary button on the right. */
  right?: React.ReactNode;
}

/**
 * Shared header for staff/detail screens (headerShown:false on the Stack) —
 * handles top safe-area + a consistent back button (44×44, sufficient touch target).
 */
export function ScreenHeader({ title, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <BackButton onPress={onBack} />
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {/* Without `right`, only reserve space to keep the title centered — do NOT draw
          the card background, otherwise an empty white square shows on the right of the header. */}
      <View style={right ? styles.btn : styles.btnSpacer}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.bg,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBare: {
    paddingRight: 8,
    justifyContent: 'center',
  },
  btnSpacer: {
    width: 44,
    height: 44,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 8,
  },
});
