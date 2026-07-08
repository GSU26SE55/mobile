import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../lib/theme';
import { AmbientReadingDto } from '../types/ambient.types';

function fmt(v: number | null | undefined, unit: string, digits = 1): string {
  if (v == null) return '—';
  return `${v.toFixed(digits)}${unit}`;
}

// data === undefined (404 / chưa có reading) → hiện empty state, không treo.
export function AmbientTile({ data }: { data: AmbientReadingDto | null | undefined }) {
  if (!data) {
    return (
      <View style={[styles.card, Shadow]}>
        <Text style={styles.title}>Môi trường</Text>
        <Text style={styles.empty}>Chưa có dữ liệu môi trường</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, Shadow]}>
      <View style={styles.header}>
        <Text style={styles.title}>Môi trường</Text>
        <Text style={styles.updatedAt}>{new Date(data.time).toLocaleString()}</Text>
      </View>
      <View style={styles.grid}>
        <Metric icon="thermometer-outline" label="Nhiệt độ" value={fmt(data.ambientTemperature, ' °C')} />
        <Metric icon="water-outline" label="Độ ẩm" value={fmt(data.humidity, ' %')} />
        <Metric icon="sunny-outline" label="Bức xạ" value={fmt(data.solarIrradiance, ' W/m²', 0)} />
      </View>
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  updatedAt: { fontSize: 11, color: Colors.textFaint, fontWeight: '600' },
  empty: { fontSize: 13, color: Colors.textMute, marginTop: 10 },
  grid: { flexDirection: 'row' },
  metric: { flex: 1, alignItems: 'center', gap: 4 },
  metricValue: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  metricLabel: { fontSize: 11, color: Colors.textMute, fontWeight: '600' },
});
