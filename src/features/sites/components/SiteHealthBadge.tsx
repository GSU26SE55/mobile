import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';

// Ngưỡng màu khuyến nghị doc: 80–100 xanh / 50–79 vàng / 0–49 đỏ.
function healthStyle(score: number): { bg: string; text: string; label: string } {
  if (score >= 80) return { bg: Colors.successLight, text: Colors.successDark, label: 'Tốt' };
  if (score >= 50) return { bg: Colors.warningLight, text: Colors.warningDark, label: 'Cần theo dõi' };
  return { bg: Colors.dangerLight, text: Colors.dangerDark, label: 'Nguy hiểm' };
}

export function SiteHealthBadge({ score }: { score: number }) {
  const s = healthStyle(score);
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.score, { color: s.text }]}>{score}</Text>
      <Text style={[styles.label, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  score: { fontSize: 13, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '700' },
});
