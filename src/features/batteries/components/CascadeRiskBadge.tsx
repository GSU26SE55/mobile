import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../lib/theme';
import { CascadeRiskDto } from '../types/cascade.types';
import { CascadeRiskLevel } from '../enums/cascade.enum';

const LEVEL_STYLE: Record<CascadeRiskLevel, { bg: string; text: string; label: string }> = {
  [CascadeRiskLevel.Low]: { bg: Colors.successLight, text: Colors.successDark, label: 'Thấp' },
  [CascadeRiskLevel.Medium]: { bg: Colors.warningLight, text: Colors.warningDark, label: 'Trung bình' },
  [CascadeRiskLevel.High]: { bg: Colors.dangerLight, text: Colors.dangerDark, label: 'Cao' },
};

// null/undefined (404 / chưa tính) → render null (ẩn badge).
export function CascadeRiskBadge({ data }: { data: CascadeRiskDto | null | undefined }) {
  if (!data) return null;
  // Domain an toàn cháy nổ: level lạ (BE thêm mức mới) → fallback mức thận trọng (Cao/đỏ),
  // KHÔNG hiển thị "Thấp/an toàn" giả gây hiểu nhầm nguy hiểm.
  const s = LEVEL_STYLE[data.level] ?? LEVEL_STYLE[CascadeRiskLevel.High];
  const pct = Math.max(0, Math.min(100, data.cascadeRiskScore * 100));

  return (
    <View style={[styles.card, Shadow]}>
      <View style={[styles.iconWrap, { backgroundColor: s.bg }]}>
        <Ionicons name="git-network-outline" size={20} color={s.text} />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>Rủi ro lan truyền</Text>
        {/* Thanh mức trực quan theo score */}
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: s.text }]} />
        </View>
        <Text style={styles.score}>Score {data.cascadeRiskScore.toFixed(2)}</Text>
      </View>
      <View style={[styles.levelPill, { backgroundColor: s.bg }]}>
        <Text style={[styles.levelText, { color: s.text }]}>{s.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 5 },
  label: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  track: { height: 6, borderRadius: 999, backgroundColor: Colors.bg2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  score: { fontSize: 11, fontWeight: '600', color: Colors.textMute },
  levelPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  levelText: { fontSize: 12, fontWeight: '800' },
});
