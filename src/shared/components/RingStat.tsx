import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Font, Solar } from '@/src/lib/theme';

interface RingProps {
  percent: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  value?: string; // large text in the middle of the ring
  label?: string; // small caption below the value
}

/** SVG progress ring. The one gauge left in the app — battery realtime SOC. */
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
      <Text style={styles.value}>{value ?? `${Math.round(p)}%`}</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  value: { fontSize: 26, fontWeight: '700', color: Solar.ink, letterSpacing: -0.5 },
  label: { ...Font.meta, fontSize: 11, marginTop: 2, textAlign: 'center' },
});
