import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Pressable, Text, View } from 'react-native';
import { CartesianChart, AreaRange, Line } from 'victory-native';
import { Colors, Radius, Shadow } from '@/src/lib/theme';
import { useSensorReadingAggregate } from '../hooks/useSensorReadingAggregate';
import { useBatteryStats } from '../hooks/useBatteryStats';
import { SensorReadingInterval, StatsWindow } from '../types/sensor-reading.types';

// GH-74 (NS-01/02) — min/max charge/discharge current. BE returns BOTH directions as POSITIVE
// values (direction is encoded in the field name), so no sign handling here. null = bucket has
// no sample for that direction → gap, do NOT render as 0.

// Long ranges use interval '1h' so the hook switches to /aggregate/hourly (continuous aggregate).
const RANGES: Record<string, { hours: number; interval: SensorReadingInterval; label: string }> = {
  '24h': { hours: 24, interval: '1h', label: '24h' },
  '7d': { hours: 24 * 7, interval: '1h', label: '7d' },
  '30d': { hours: 24 * 30, interval: '1h', label: '30d' },
};
type RangeKey = keyof typeof RANGES;
const RANGE_KEYS = Object.keys(RANGES) as RangeKey[];

const WINDOWS: { key: StatsWindow; label: string }[] = [
  { key: '1h', label: '1h' },
  { key: 'today', label: 'Today' },
];

const CHART_HEIGHT = 190;
const MAX_X_LABELS = 4;

const CHARGE_COLOR = Colors.success;
const DISCHARGE_COLOR = Colors.info;

// null (no sample) ≠ 0A (a valid measured value) → show '—'.
function formatAmp(v?: number | null): string {
  return v == null ? '—' : `${v.toFixed(2)} A`;
}

function formatBucketLabel(iso: string, range: RangeKey): string {
  const d = new Date(iso);
  if (range === '24h') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
}

export function ChargeDischargeChart({ assetId }: { assetId: string }) {
  const [range, setRange] = useState<RangeKey>('24h');
  const [window, setWindow] = useState<StatsWindow>('1h');

  const { hours, interval } = RANGES[range];
  const { data = [], isLoading } = useSensorReadingAggregate(assetId, { hours, interval });
  const { data: stats } = useBatteryStats(assetId, window);

  // yKeys accept null (victory-native `MaybeNumber`) → a natural gap, no interpolation.
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        t: new Date(d.time).getTime(),
        chargeMin: d.minChargeCurrent,
        chargeMax: d.maxChargeCurrent,
        chargeAvg: d.avgChargeCurrent,
        dischargeMin: d.minDischargeCurrent,
        dischargeMax: d.maxDischargeCurrent,
        dischargeAvg: d.avgDischargeCurrent,
      })),
    [data],
  );

  const xLabels = useMemo(() => {
    if (data.length === 0) return [];
    const step = Math.max(1, Math.ceil(data.length / MAX_X_LABELS));
    return data.filter((_, i) => i % step === 0).map((d) => formatBucketLabel(d.time, range));
  }, [data, range]);

  const renderChart = () => {
    if (isLoading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.emptyText}>Loading data…</Text>
        </View>
      );
    }
    if (chartData.length < 2) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Not enough data to render the chart</Text>
        </View>
      );
    }
    return (
      <View style={{ height: CHART_HEIGHT }}>
        {/* no font passed → Skia won't render axis labels; X labels render via <Text> below. */}
        <CartesianChart
          data={chartData}
          xKey="t"
          yKeys={[
            'chargeMin',
            'chargeMax',
            'chargeAvg',
            'dischargeMin',
            'dischargeMax',
            'dischargeAvg',
          ]}
        >
          {({ points }) => (
            <>
              <AreaRange
                upperPoints={points.chargeMax}
                lowerPoints={points.chargeMin}
                color="rgba(52,199,89,0.18)"
              />
              <Line points={points.chargeAvg} color={CHARGE_COLOR} strokeWidth={2} />
              <AreaRange
                upperPoints={points.dischargeMax}
                lowerPoints={points.dischargeMin}
                color="rgba(0,122,255,0.16)"
              />
              <Line points={points.dischargeAvg} color={DISCHARGE_COLOR} strokeWidth={2} />
            </>
          )}
        </CartesianChart>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Peak charge/discharge</Text>
        <View style={styles.tabs}>
          {RANGE_KEYS.map((k) => (
            <Pressable
              key={k}
              onPress={() => setRange(k)}
              style={[styles.tab, range === k && styles.tabActive]}
            >
              <Text style={[styles.tabText, range === k && styles.tabTextActive]}>
                {RANGES[k].label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Realtime peak — SSE `stats`; before the first event it's the seed from REST /aggregate. */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Peak charge</Text>
          <Text style={[styles.statValue, { color: CHARGE_COLOR }]}>
            {formatAmp(stats?.maxChargeCurrent)}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Peak discharge</Text>
          <Text style={[styles.statValue, { color: DISCHARGE_COLOR }]}>
            {formatAmp(stats?.maxDischargeCurrent)}
          </Text>
        </View>
        <View style={styles.windowTabs}>
          {WINDOWS.map((w) => (
            <Pressable
              key={w.key}
              onPress={() => setWindow(w.key)}
              style={[styles.tab, window === w.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, window === w.key && styles.tabTextActive]}>
                {w.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {renderChart()}

      {xLabels.length > 0 && (
        <View style={styles.xAxis}>
          {xLabels.map((l, i) => (
            <Text key={`${l}-${i}`} style={styles.xLabel}>
              {l}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: CHARGE_COLOR }]} />
          <Text style={styles.legendText}>Charge (min–max)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: DISCHARGE_COLOR }]} />
          <Text style={styles.legendText}>Discharge (min–max)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 16,
    ...Shadow,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: Colors.text },
  tabs: { flexDirection: 'row', gap: 4 },
  windowTabs: { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  tab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.xs },
  tabActive: { backgroundColor: Colors.primaryLight },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.gray },
  tabTextActive: { color: Colors.primaryDark },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 14, marginBottom: 6 },
  statBox: { gap: 2 },
  statLabel: { fontSize: 11, color: Colors.gray, fontWeight: '600' },
  statValue: { fontSize: 17, fontWeight: '800' },

  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  xLabel: { fontSize: 10, color: Colors.gray },

  legend: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.text2 },

  empty: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 13, color: Colors.gray },
});
