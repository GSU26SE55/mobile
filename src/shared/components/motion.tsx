import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Solar } from '@/src/lib/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Motion primitives. MOTION_INTENSITY: 4 — enough that the app acknowledges
// touch and shows content arriving, without the cinematic layer a marketing
// page gets. Every animation here has one job:
//
//   PressableScale  → feedback:          the tap is acknowledged before the
//                                        navigation transition starts.
//   Skeleton        → state transition:  shows the SHAPE of what is loading,
//                                        instead of a spinner that says nothing.
//   enterRow        → hierarchy:         the first screenful arrives top-down
//                                        so the eye lands on row one.
//
// Rules followed: only `transform` and `opacity` are animated (both run on the
// UI thread), and every effect collapses to static under Reduce Motion.
// ─────────────────────────────────────────────────────────────────────────────

/** Snappy, no overshoot — this is a UI acknowledging a finger, not a bouncy toy. */
const PRESS_SPRING = { damping: 26, stiffness: 340, mass: 0.5 } as const;

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far it sinks. Smaller for big surfaces, larger for small controls. */
  scaleTo?: number;
  children: React.ReactNode;
}

// The Pressable IS the animated box. Wrapping an Animated.View *inside* a
// Pressable instead would strand layout props (`flex: 1`) on the inner view,
// so a row of `fill` chips would never share the width.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable with a spring press-down. Replaces the `pressed && {opacity, scale}`
 * pattern, which snaps to its end state in one frame and reads as a flicker
 * rather than a press.
 */
export function PressableScale({
  style,
  scaleTo = 0.97,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        if (!reduced) scale.value = withSpring(scaleTo, PRESS_SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) scale.value = withSpring(1, PRESS_SPRING);
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

/** How many rows animate in. Roughly one screenful. */
const ENTER_ROWS = 8;

/**
 * Entry animation for a list row, or `undefined` past the first screenful.
 *
 * Only the rows already on screen animate. Beyond that the user is scrolling,
 * and a layout animation firing on every row as it recycles is what makes a
 * list stutter — the arrival is not worth the dropped frames.
 */
export function enterRow(index: number) {
  if (index >= ENTER_ROWS) return undefined;
  return FadeInDown.delay(index * 45).duration(240);
}

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * One shimmering block. Skeletons beat spinners because they reserve the real
 * layout — the list does not jump when data lands.
 */
export function Skeleton({ width = '100%', height = 12, radius = 6, style }: SkeletonProps) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(reduced ? 0.55 : 1);

  React.useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(withTiming(0.4, { duration: 900 }), -1, true);
    // cancels with the component — the shared value is torn down on unmount
  }, [reduced, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: Solar.tile },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Card-shaped container for skeleton rows — matches the real card's surface. */
export function SkeletonCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
});
