import { useReducedMotion } from 'react-native-reanimated';
import { Colors } from '@/src/lib/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation motion — state transition: it tells the reader whether they went
// deeper (slide across), opened a task (rise from the bottom), or switched
// context (tab shift). Six navigators were each spelling their own options,
// which is how they drifted apart.
//
// Native-stack animations run on the native thread, so they stay smooth while
// the JS thread is busy fetching the screen's data.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default push/pop. Slightly faster than the 350ms platform default — at 260ms
 * the screen feels answered rather than escorted.
 */
export function useStackTransition() {
  const reduced = useReducedMotion();
  return {
    headerShown: false as const,
    contentStyle: { backgroundColor: Colors.bg },
    animation: (reduced ? 'none' : 'slide_from_right') as 'none' | 'slide_from_right',
    animationDuration: 260,
    // Swipe-back everywhere, not just iOS: a one-handed reader should be able to
    // leave a screen without reaching the top-left corner.
    gestureEnabled: true,
  };
}

/**
 * For screens that start a task rather than drill into content (create ticket,
 * scan a device). Rising from the bottom reads as "a thing opened on top", so
 * dismissing it does not feel like losing your place in the list.
 */
export function useModalTransition() {
  const reduced = useReducedMotion();
  return {
    animation: (reduced ? 'none' : 'slide_from_bottom') as 'none' | 'slide_from_bottom',
    animationDuration: 300,
    gestureEnabled: true,
  };
}

/**
 * Tabs do NOT animate. `shift` and `fade` both keep two screens mounted through
 * the transition, and every screen here paints a full-bleed EnergyBackdrop
 * (SVG polygons + two gradients) — the overlap shows up as ghosting and drops
 * frames. Native tab bars swap instantly; so do these.
 */
export function useTabTransition() {
  return { animation: 'none' as const };
}
