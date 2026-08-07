import React, { useMemo, useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors, Radius, Shadow, Solar } from '@/src/lib/theme';
import { useSensorReadingAggregate } from '../hooks/useSensorReadingAggregate';
import { SensorReadingAggregateDto, SensorReadingInterval } from '../types/sensor-reading.types';

type MetricKey = 'socPercent' | 'voltage' | 'current' | 'temperature';

const METRICS: { key: MetricKey; label: string; unit: string; pick: (d: SensorReadingAggregateDto) => number }[] = [
  { key: 'socPercent', label: 'SOC', unit: '%', pick: (d) => d.avgSocPercent },
  { key: 'voltage', label: 'Điện áp', unit: 'V', pick: (d) => d.avgVoltage },
  { key: 'current', label: 'Dòng điện', unit: 'A', pick: (d) => d.avgCurrent },
  { key: 'temperature', label: 'Nhiệt độ', unit: '°C', pick: (d) => d.avgTemperature },
];

// Range lớn dùng bucket thô hơn — khớp cách BE tổng hợp qua TimescaleDB time_bucket.
const RANGES: Record<string, { hours: number; interval: SensorReadingInterval; label: string }> = {
  '1h': { hours: 1, interval: '1m', label: '1 giờ' },
  '24h': { hours: 24, interval: '1h', label: '24 giờ' },
  '7d': { hours: 24 * 7, interval: '1h', label: '7 ngày' },
  '30d': { hours: 24 * 30, interval: '1d', label: '30 ngày' },
};
type RangeKey = keyof typeof RANGES;
const RANGE_KEYS = Object.keys(RANGES) as RangeKey[];

const CHART_HEIGHT = 180;
const MAX_X_LABELS = 5;

function formatBucketLabel(iso: string, range: RangeKey): string {
  const d = new Date(iso);
  if (range === '1h') return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (range === '30d') return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function SensorChart({ assetId }: { assetId: string }) {
  const [metric, setMetric] = useState<MetricKey>('socPercent');
  const [range, setRange] = useState<RangeKey>('24h');
  const [width, setWidth] = useState(0);

  const { hours, interval } = RANGES[range];
  const { data = [], isLoading, isFetching } = useSensorReadingAggregate(assetId, { hours, interval });

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const active = METRICS.find((m) => m.key === metric)!;
  const labelStep = Math.max(1, Math.ceil(data.length / MAX_X_LABELS));

  const chartPoints = useMemo(
    () =>
      data.map((d, i) => {
        const value = active.pick(d);
        return {
          value,
          label: i % labelStep === 0 || i === data.length - 1 ? formatBucketLabel(d.time, range) : '',
        };
      }),
    [data, active, labelStep, range],
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator color={Solar.yellowDeep} />
          <Text style={styles.emptyText}>Đang tải dữ liệu…</Text>
        </View>
      );
    }

    if (data.length < 2) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Chưa đủ dữ liệu để vẽ biểu đồ</Text>
        </View>
      );
    }

    return (
      <View onLayout={onLayout}>
        {width > 0 ? (
          <LineChart
            data={chartPoints}
            height={CHART_HEIGHT}
            width={width}
            adjustToWidth
            initialSpacing={12}
            endSpacing={12}
            color={Solar.yellow}
            thickness={2.5}
            curved
            areaChart
            startFillColor={Solar.yellow}
            endFillColor={Colors.white}
            startOpacity={0.3}
            endOpacity={0.02}
            hideDataPoints={chartPoints.length > 16}
            dataPointsColor={Solar.yellowDeep}
            dataPointsRadius={3}
            yAxisTextStyle={styles.axisTickText}
            xAxisLabelTextStyle={styles.axisTickText}
            yAxisColor={Colors.border}
            xAxisColor={Colors.border}
            rulesColor={Colors.border}
            noOfSections={4}
            yAxisLabelSuffix={active.unit}
            yAxisLabelWidth={44}
            xAxisLabelsHeight={18}
            pointerConfig={{
              pointerStripHeight: CHART_HEIGHT,
              pointerStripColor: Colors.border,
              pointerColor: Solar.yellow,
              radius: 5,
              pointerLabelWidth: 110,
              pointerLabelHeight: 44,
              activatePointersInstantlyOnTouch: true,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items: { value: number; label: string }[]) => (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipValue}>
                    {items[0]?.value?.toFixed(1) ?? '—'}
                    {active.unit}
                  </Text>
                  {items[0]?.label ? <Text style={styles.tooltipLabel}>{items[0].label}</Text> : null}
                </View>
              ),
            }}
          />
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.card, Shadow]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Biểu đồ cảm biến</Text>
            {isFetching && !isLoading ? <ActivityIndicator size="small" color={Colors.textFaint} /> : null}
          </View>
          <View style={styles.rangeTabs}>
            {RANGE_KEYS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[styles.rangeTab, range === r && styles.rangeTabActive]}
              >
                <Text style={[styles.rangeTabText, range === r && styles.rangeTabTextActive]}>
                  {RANGES[r].label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
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
    overflow: 'hidden',
  },
  header: { marginBottom: 12, gap: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  rangeTabs: { flexDirection: 'row', gap: 4, backgroundColor: Colors.bg, borderRadius: 999, padding: 3 },
  rangeTab: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  rangeTabActive: { backgroundColor: Colors.white, ...Shadow },
  rangeTabText: { fontSize: 11, fontWeight: '700', color: Colors.textMute },
  rangeTabTextActive: { color: Colors.accent },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.bg,
  },
  tabActive: { backgroundColor: Solar.yellowSoft },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.textMute },
  tabTextActive: { color: Solar.yellowDeep },
  empty: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 13, color: Colors.textMute },
  axisTickText: { fontSize: 10, color: Colors.textFaint, fontWeight: '600' },
  tooltip: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  tooltipValue: { fontSize: 12, fontWeight: '800', color: Colors.white },
  tooltipLabel: { fontSize: 10, color: Colors.graySoft, marginTop: 1 },
});
