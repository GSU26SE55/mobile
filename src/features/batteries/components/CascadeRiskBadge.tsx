import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../../../lib/theme';
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

  return (
    <View style={[styles.card, { backgroundColor: s.bg }]}>
      <Ionicons name="git-network-outline" size={16} color={s.text} />
      <View style={styles.body}>
        <Text style={[styles.label, { color: s.text }]}>Rủi ro lan truyền: {s.label}</Text>
        <Text style={[styles.score, { color: s.text }]}>
          Score {data.cascadeRiskScore.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  body: { flex: 1 },
  label: { fontSize: 13, fontWeight: '800' },
  score: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
