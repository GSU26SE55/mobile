import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline, Line as SvgLine } from 'react-native-svg';
import { Colors, Radius, Shadow } from '../../../lib/theme';
import { SensorReadingAggregateDto } from '../types/sensor-reading.types';

type MetricKey = 'socPercent' | 'voltage' | 'temperature';

const METRICS: { key: MetricKey; label: string; unit: string; pick: (d: SensorReadingAggregateDto) => number }[] = [
  { key: 'socPercent', label: 'SOC', unit: '%', pick: (d) => d.avgSocPercent },
  { key: 'voltage', label: 'Điện áp', unit: 'V', pick: (d) => d.avgVoltage },
  { key: 'temperature', label: 'Nhiệt độ', unit: '°C', pick: (d) => d.avgTemperature },
];

const CHART_HEIGHT = 160;
const PAD = 8;

export function SensorChart({ data }: { data: SensorReadingAggregateDto[] }) {
  const [metric, setMetric] = useState<MetricKey>('socPercent');
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const active = METRICS.find((m) => m.key === metric)!;

  const renderBody = () => {
    if (data.length < 2) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Chưa đủ dữ liệu để vẽ biểu đồ</Text>
        </View>
      );
    }

    const values = data.map(active.pick);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const innerW = Math.max(width - PAD * 2, 1);
    const innerH = CHART_HEIGHT - PAD * 2;

    const points = values
      .map((v, i) => {
        const x = PAD + (innerW * i) / (values.length - 1);
        const y = PAD + innerH - ((v - min) / range) * innerH;
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
            <Polyline
              points={points}
              fill="none"
              stroke={Colors.primary}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </Svg>
        ) : null}
        <View style={styles.axisRow}>
          <Text style={styles.axisText}>min {min.toFixed(1)}{active.unit}</Text>
          <Text style={styles.axisText}>max {max.toFixed(1)}{active.unit}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.card, Shadow]}>
      <View style={styles.header}>
        <Text style={styles.title}>Biểu đồ cảm biến (24h)</Text>
        <View style={styles.tabs}>
          {METRICS.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => setMetric(m.key)}
              style={[styles.tab, metric === m.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, metric === m.key && styles.tabTextActive]}>{m.label}</Text>
            </Pressable>
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
  header: { marginBottom: 12, gap: 12 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.bg,
  },
  tabActive: { backgroundColor: Colors.primaryLight },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.textMute },
  tabTextActive: { color: Colors.primaryDark },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisText: { fontSize: 11, color: Colors.textFaint, fontWeight: '600' },
  empty: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, color: Colors.textMute },
});
