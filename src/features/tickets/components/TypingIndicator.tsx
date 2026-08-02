import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';

const DOT_COUNT = 3;
const DOT_DURATION = 500;
const DOT_STAGGER = 160;

/** 1 chấm nhấp nháy mờ/sáng lệch pha, lặp vô hạn (opacity 0.3↔1, chu kỳ 1s — khớp web). */
function Dot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | null = null;
    const timer = setTimeout(() => {
      if (cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: DOT_DURATION, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: DOT_DURATION, useNativeDriver: true }),
        ]),
      );
      loop.start();
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      loop?.stop();
    };
  }, [delay, anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  return <Animated.View style={[styles.dot, { opacity }]} />;
}

interface Props {
  /** Tên những người đang nhập. */
  names: string[];
}

/**
 * Chỉ báo "đang nhập" dạng chữ, nền trong suốt — khớp y hệt web. 1 người → "[Tên] đang nhập";
 * nhiều người → "N người đang nhập". Kèm 3 chấm nhấp nháy nhỏ.
 */
export function TypingIndicator({ names }: Props) {
  if (names.length === 0) return null;

  const label = names.length === 1 ? `${names[0]} đang nhập` : `${names.length} người đang nhập`;

  return (
    <View style={styles.row}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.dots}>
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <Dot key={i} delay={i * DOT_STAGGER} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  text: { color: Colors.textMute, fontSize: 11, fontStyle: 'italic', flexShrink: 1 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textMute },
});
