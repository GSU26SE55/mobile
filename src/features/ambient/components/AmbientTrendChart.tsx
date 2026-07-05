import React, { useMemo, useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors, Radius, Shadow } from '../../../lib/theme';
import { useAmbientTrend } from '../hooks/useAmbientTrend';
import { AmbientGranularity, AmbientTrendPoint } from '../types/ambient.types';

// Vẽ avg/max/min nhiệt độ theo bucket — react-native-gifted-charts (LineChart dataSet nhiều series).
const SERIES: { key: keyof Pick<AmbientTrendPoint, 'avgTemp' | 'maxTemp' | 'minTemp'>; color: string; label: string }[] = [
  { key: 'maxTemp', color: Colors.danger, label: 'Max' },
  { key: 'avgTemp', color: Colors.primary, label: 'Avg' },
  { key: 'minTemp', color: Colors.info, label: 'Min' },
];

const GRANULARITIES: { key: AmbientGranularity; label: string }[] = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
];

const CHART_HEIGHT = 180;
const MAX_X_LABELS = 5;

function formatBucketLabel(iso: string, granularity: AmbientGranularity): string {
  const d = new Date(iso);
  if (granularity === 'month') return d.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' });
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function AmbientTrendChart({ siteId }: { siteId: string }) {
  const [granularity, setGranularity] = useState<AmbientGranularity>('day');
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const { data = [], isLoading, isFetching } = useAmbientTrend(siteId, { granularity });
  const labelStep = Math.max(1, Math.ceil(data.length / MAX_X_LABELS));

  const dataSet = useMemo(
    () =>
      SERIES.map((s) => ({
        color: s.color,
        thickness: 2,
        hideDataPoints: data.length > 16,
        dataPointsColor: s.color,
        data: data.map((d, i) => ({
          value: d[s.key],
          label: i % labelStep === 0 || i === data.length - 1 ? formatBucketLabel(d.date, granularity) : '',
        })),
      })),
    [data, labelStep, granularity],
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.primary} />
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
            dataSet={dataSet}
            height={CHART_HEIGHT}
            width={width}
            adjustToWidth
            initialSpacing={12}
            endSpacing={12}
            curved
            yAxisTextStyle={styles.axisTickText}
            xAxisLabelTextStyle={styles.axisTickText}
            yAxisColor={Colors.border}
            xAxisColor={Colors.border}
            rulesColor={Colors.border}
            noOfSections={4}
            yAxisLabelSuffix="°C"
            yAxisLabelWidth={40}
            xAxisLabelsHeight={18}
            pointerConfig={{
              pointerStripHeight: CHART_HEIGHT,
              pointerStripColor: Colors.border,
              pointerColor: Colors.primary,
              radius: 5,
              pointerLabelWidth: 130,
              pointerLabelHeight: 64,
              activatePointersInstantlyOnTouch: true,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items: { value: number; label: string }[]) => (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipLabel}>{items[0]?.label}</Text>
                  {SERIES.map((s, idx) => (
                    <Text key={s.key} style={[styles.tooltipValue, { color: s.color }]}>
                      {s.label}: {items[idx]?.value?.toFixed(1) ?? '—'}°C
                    </Text>
                  ))}
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
            <Text style={styles.title}>Xu hướng nhiệt độ môi trường</Text>
            {isFetching && !isLoading ? <ActivityIndicator size="small" color={Colors.textFaint} /> : null}
          </View>
          <View style={styles.rangeTabs}>
            {GRANULARITIES.map((g) => (
              <Pressable
                key={g.key}
                onPress={() => setGranularity(g.key)}
                style={[styles.rangeTab, granularity === g.key && styles.rangeTabActive]}
              >
                <Text style={[styles.rangeTabText, granularity === g.key && styles.rangeTabTextActive]}>
                  {g.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
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
    overflow: 'hidden',
  },
  header: { marginBottom: 12, gap: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.accent, flexShrink: 1 },
  rangeTabs: { flexDirection: 'row', gap: 4, backgroundColor: Colors.bg, borderRadius: 999, padding: 3 },
  rangeTab: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  rangeTabActive: { backgroundColor: Colors.white, ...Shadow },
  rangeTabText: { fontSize: 11, fontWeight: '700', color: Colors.textMute },
  rangeTabTextActive: { color: Colors.accent },
  legend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textMute, fontWeight: '600' },
  empty: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 13, color: Colors.textMute },
  axisTickText: { fontSize: 10, color: Colors.textFaint, fontWeight: '600' },
  tooltip: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tooltipValue: { fontSize: 11, fontWeight: '800' },
  tooltipLabel: { fontSize: 10, color: Colors.graySoft, marginBottom: 2 },
});
