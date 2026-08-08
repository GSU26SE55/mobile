import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '@/src/lib/theme';
import { useBatteryTypeDetail } from '@/src/features/battery-types/hooks/useBatteryTypeDetail';
import {
  BatteryChemistryEnum,
  BATTERY_CHEMISTRY_LABEL,
} from '@/src/features/battery-types/enums/battery-type.enum';
import { useThresholdByType } from '@/src/features/battery-types/hooks/useThresholdByType';
import { BackButton } from '@/src/shared/components/ScreenHeader';

/** `0` is a valid threshold, so check null/undefined — do not use a falsy check. */
const fmt = (v: number | null | undefined, unit: string) =>
  v === null || v === undefined ? '—' : `${v} ${unit}`;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function BatteryTypeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useBatteryTypeDetail(id ?? '');
  // Threshold config is a separate endpoint — its loading/error state is independent and doesn't block the specs section.
  const { data: threshold, isLoading: loadingThreshold } = useThresholdByType(id ?? '');

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <Text style={styles.topTitle} numberOfLines={1}>Battery Type Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError || !data ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.textMute} />
          <Text style={styles.emptyText}>Failed to load details.</Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, Shadow]}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.name}>{data.name}</Text>
          <View style={[styles.card, Shadow]}>
            <Row label="Manufacturer" value={data.manufacturer ?? '—'} />
            <Row
              label="Chemistry"
              value={BATTERY_CHEMISTRY_LABEL[data.chemistry as BatteryChemistryEnum] ?? '—'}
            />
            <Row label="Nominal capacity" value={`${data.nominalCapacityAh} Ah`} />
            <Row label="Nominal voltage" value={`${data.nominalVoltage} V`} />
            <Row label="Max cycle count" value={`${data.maxCycleCount}`} />
          </View>
          {data.description ? (
            <View style={[styles.card, Shadow]}>
              <Text style={styles.descLabel}>Description</Text>
              <Text style={styles.descText}>{data.description}</Text>
            </View>
          ) : null}

          {/* Alert thresholds — when a reading crosses these marks, the system fires an Alert.
              Staff can only view; editing is an Admin permission (enforced by BE at the role level). */}
          <Text style={styles.sectionTitle}>Alert Thresholds</Text>
          {loadingThreshold ? (
            <View style={[styles.card, Shadow, styles.cardCenter]}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : !threshold ? (
            <View style={[styles.card, Shadow]}>
              <Text style={styles.emptyText}>This battery type has no configured thresholds yet.</Text>
            </View>
          ) : (
            <View style={[styles.card, Shadow]}>
              <Row label="Voltage" value={`${threshold.voltageMin} – ${threshold.voltageMax} V`} />
              <Row
                label="Temperature"
                value={`${threshold.temperatureMin} – ${threshold.temperatureMax} °C`}
              />
              <Row label="SOC warning" value={fmt(threshold.socWarningThreshold, '%')} />
              <Row label="SOC critical" value={fmt(threshold.socCriticalThreshold, '%')} />
              <Row label="Max charge current" value={fmt(threshold.currentMaxCharge, 'A')} />
              <Row label="Max discharge current" value={fmt(threshold.currentMaxDischarge, 'A')} />
              <Row label="SOH warning" value={fmt(threshold.sohWarningThreshold, '%')} />
              <Row label="SOH critical" value={fmt(threshold.sohCriticalThreshold, '%')} />
              {!threshold.isActive ? (
                <Text style={styles.inactiveNote}>This configuration is currently inactive.</Text>
              ) : null}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  headerSpacer: { width: 44 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  content: { padding: 16 },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  infoLabel: { fontSize: 13, color: Colors.textMute },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 4 },
  cardCenter: { alignItems: 'center' },
  inactiveNote: { fontSize: 12, color: Colors.textMute, marginTop: 8, fontStyle: 'italic' },
  descLabel: { fontSize: 13, color: Colors.textMute, marginBottom: 6 },
  descText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMute },
  retryBtn: { backgroundColor: Colors.card, borderRadius: Radius.sm, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
