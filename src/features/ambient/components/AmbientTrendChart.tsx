import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline, Line as SvgLine } from 'react-native-svg';
import { Colors, Radius, Shadow } from '../../../lib/theme';
import { AmbientTrendPoint } from '../types/ambient.types';

// Vẽ avg/max/min nhiệt độ theo bucket — react-native-svg (cùng pattern SensorChart, không dùng Victory).
const CHART_HEIGHT = 160;
const PAD = 8;

const SERIES: { key: keyof Pick<AmbientTrendPoint, 'avgTemp' | 'maxTemp' | 'minTemp'>; color: string; label: string }[] = [
  { key: 'maxTemp', color: Colors.danger, label: 'Max' },
  { key: 'avgTemp', color: Colors.primary, label: 'Avg' },
  { key: 'minTemp', color: Colors.info, label: 'Min' },
];

export function AmbientTrendChart({ data }: { data: AmbientTrendPoint[] }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const renderBody = () => {
    if (data.length < 2) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Chưa đủ dữ liệu để vẽ biểu đồ</Text>
        </View>
      );
    }

    // Scale chung cho cả 3 series theo dải [min của minTemp, max của maxTemp].
    const allMin = Math.min(...data.map((d) => d.minTemp));
    const allMax = Math.max(...data.map((d) => d.maxTemp));
    const range = allMax - allMin || 1;

    const innerW = Math.max(width - PAD * 2, 1);
    const innerH = CHART_HEIGHT - PAD * 2;

    const toPoints = (pick: (d: AmbientTrendPoint) => number) =>
      data
        .map((d, i) => {
          const x = PAD + (innerW * i) / (data.length - 1);
          const y = PAD + innerH - ((pick(d) - allMin) / range) * innerH;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    return (
      <View onLayout={onLayout}>
        {width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            <SvgLine x1={PAD} y1={PAD} x2={PAD} y2={CHART_HEIGHT - PAD} stroke={Colors.border} strokeWidth={1} />
            <SvgLine
              x1={PAD}
              y1={CHART_HEIGHT - PAD}
              x2={width - PAD}
              y2={CHART_HEIGHT - PAD}
              stroke={Colors.border}
              strokeWidth={1}
            />
            {SERIES.map((s) => (
              <Polyline
                key={s.key}
                points={toPoints((d) => d[s.key])}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </Svg>
        ) : null}
        <View style={styles.axisRow}>
          <Text style={styles.axisText}>{allMin.toFixed(1)}°C</Text>
          <Text style={styles.axisText}>{allMax.toFixed(1)}°C</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.card, Shadow]}>
      <View style={styles.header}>
        <Text style={styles.title}>Xu hướng nhiệt độ môi trường</Text>
        <View style={styles.legend}>
          {SERIES.map((s) => (
            <View key={s.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 18,
    marginBottom: 16,
  },
  header: { marginBottom: 12, gap: 10 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  legend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textMute, fontWeight: '600' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisText: { fontSize: 11, color: Colors.textFaint, fontWeight: '600' },
  empty: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, color: Colors.textMute },
});
