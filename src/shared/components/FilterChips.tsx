import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Font, Solar } from '@/src/lib/theme';
import { PressableScale } from './motion';

// One chip row for the whole app. Replaces three near-identical hand-rolled
// copies (staff dashboard, customer tickets, customer alerts) that had drifted
// apart in padding, radius and active colour.

export interface FilterChipItem<K extends string | number> {
  key: K;
  label: string;
  count?: number | null;
}

interface Props<K extends string | number> {
  items: FilterChipItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /**
   * Chips share the row evenly instead of scrolling. Use for 2-3 short labels;
   * anything longer wraps badly at 360dp, so leave it off and let it scroll.
   */
  fill?: boolean;
}

/**
 * The selected chip's fill springs in rather than cutting — state transition:
 * it ties the tap to the list swapping underneath it.
 */
function Chip<K extends string | number>({
  item,
  active,
  fill,
  onPress,
}: {
  item: FilterChipItem<K>;
  active: boolean;
  fill: boolean;
  onPress: () => void;
}) {
  const reduced = useReducedMotion();

  const fillStyle = useAnimatedStyle(() => ({
    opacity: reduced ? (active ? 1 : 0) : withSpring(active ? 1 : 0, { damping: 22, stiffness: 260 }),
  }));

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, fill && styles.chipFill]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.chipFillLayer, fillStyle]} />
      <Animated.Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {item.label}
        {item.count != null ? ` ${item.count}` : ''}
      </Animated.Text>
    </PressableScale>
  );
}

export function FilterChips<K extends string | number>({ items, value, onChange, fill = false }: Props<K>) {
  const chips = items.map((item) => (
    <Chip
      key={String(item.key)}
      item={item}
      active={item.key === value}
      fill={fill}
      onPress={() => onChange(item.key)}
    />
  ));

  if (fill) return <View style={styles.fillRow}>{chips}</View>;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollRow}
    >
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fillRow: { flexDirection: 'row', gap: 8 },
  scrollRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Solar.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipFill: { flex: 1, paddingHorizontal: 8 },
  chipFillLayer: { backgroundColor: Solar.yellow, borderRadius: 999 },
  label: { ...Font.meta },
  labelActive: { color: Solar.ink, fontWeight: '700' },
});
