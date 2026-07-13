import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Shadow } from '../../lib/theme';

// Layout chữ ký của Home mới: 2 tile tròn hai bên + 1 vòng tiến độ lớn ở giữa.
// Màu giữ nguyên palette hiện tại (xanh primary / cam warning), chỉ đổi bố cục.

interface RingProps {
  percent: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  value?: string; // text lớn giữa vòng (mặc định `${percent}%`)
  label?: string; // caption nhỏ dưới value
}

export function RingStat({
  percent,
  size = 128,
  strokeWidth = 11,
  color = Colors.primary,
  trackColor = Colors.card3,
  value,
  label,
}: RingProps) {
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - p / 100);
  const c = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      <Text style={styles.ringValue}>{value ?? `${Math.round(p)}%`}</Text>
      {label ? <Text style={styles.ringLabel}>{label}</Text> : null}
    </View>
  );
}

function SideTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

interface TrioProps {
  left: { value: string; label: string };
  right: { value: string; label: string };
  center: { percent: number; value?: string; label: string; color?: string };
}

export function StatTrio({ left, center, right }: TrioProps) {
  return (
    <View style={[styles.card, Shadow]}>
      <SideTile value={left.value} label={left.label} />
      <RingStat percent={center.percent} value={center.value} label={center.label} color={center.color} />
      <SideTile value={right.value} label={right.label} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 12,
    marginBottom: 24,
    flexDirection: 'row',
    // Tile hai bên hạ thấp xuống (căn đáy theo vòng ở giữa) thay vì căn giữa.
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  ringValue: { fontSize: 28, fontWeight: '800', color: Colors.accent },
  ringLabel: { fontSize: 11, color: Colors.gray, fontWeight: '600', marginTop: 2, textAlign: 'center' },

  tile: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  tileValue: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  tileLabel: { fontSize: 10, color: Colors.gray, fontWeight: '600', marginTop: 3, textAlign: 'center' },
});
