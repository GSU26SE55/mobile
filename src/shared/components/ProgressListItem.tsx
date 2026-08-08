import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadow } from '@/src/lib/theme';

// New Home-style list row: [color dot] title ... [status badge]
// followed by a horizontal progress bar, and a right-aligned caption below.
// Bar/badge colors are passed in from outside (keeps the current palette).

interface Props {
  title: string;
  dotColor?: string; // leading round dot (leave empty = hidden)
  badge?: { label: string; bg: string; text: string };
  percent: number; // 0-100 bar fill
  barColor: string;
  caption?: string; // e.g. "96% · 51.2V" or "2 days left"
  onPress?: () => void;
}

export function ProgressListItem({ title, dotColor, badge, percent, barColor, caption, onPress }: Props) {
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));

  return (
    <Pressable style={[styles.card, Shadow]} onPress={onPress} disabled={!onPress}>
      <View style={styles.topRow}>
        {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ flex: 1 }} />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${p}%`, backgroundColor: barColor }]} />
      </View>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  title: { fontSize: 14, fontWeight: '800', color: Colors.accent, flexShrink: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  track: { height: 7, borderRadius: 999, backgroundColor: Colors.card3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  caption: { fontSize: 11, color: Colors.gray, fontWeight: '600', marginTop: 8, textAlign: 'right' },
});
