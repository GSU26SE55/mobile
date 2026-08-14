import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateTime } from '@/src/lib/date';
import { Colors, Radius, Shadow, Solar } from '@/src/lib/theme';
import { AlertDto } from '../types/alert.types';
import {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from '@/src/shared/enums/alert.enum';

const SEVERITY_STYLE: Record<AlertSeverityEnum, { label: string; color: string; bg: string }> = {
  [AlertSeverityEnum.Info]: { label: 'Info', color: Colors.info, bg: Colors.infoLight },
  [AlertSeverityEnum.Warning]: { label: 'Warning', color: Colors.warningDark, bg: Colors.warningLight },
  [AlertSeverityEnum.Critical]: { label: 'Critical', color: Colors.danger, bg: Colors.dangerLight },
};

const STATUS_LABEL: Record<AlertStatusEnum, string> = {
  [AlertStatusEnum.Open]: 'Open',
  [AlertStatusEnum.Acknowledged]: 'Acknowledged',
  [AlertStatusEnum.Merged]: 'Merged',
  [AlertStatusEnum.Resolved]: 'Resolved',
};

export const ANOMALY_LABEL: Record<AnomalyTypeEnum, string> = {
  [AnomalyTypeEnum.Overheat]: 'Overheat',
  [AnomalyTypeEnum.Overvoltage]: 'Overvoltage',
  [AnomalyTypeEnum.Undervoltage]: 'Undervoltage',
  [AnomalyTypeEnum.LowSoc]: 'Low SOC',
  [AnomalyTypeEnum.RapidDischarge]: 'Rapid discharge',
  [AnomalyTypeEnum.AbnormalCharging]: 'Abnormal charging',
  [AnomalyTypeEnum.DeviceOffline]: 'Device offline',
  [AnomalyTypeEnum.SohDegradation]: 'SOH degradation',
  [AnomalyTypeEnum.HighAmbientTemp]: 'High ambient temperature',
  [AnomalyTypeEnum.HighHumidity]: 'High humidity',
  [AnomalyTypeEnum.HighTempHumidityCombo]: 'High temperature + humidity',
  [AnomalyTypeEnum.HighInternalResistance]: 'High internal resistance',
  [AnomalyTypeEnum.CellImbalance]: 'Cell imbalance',
  [AnomalyTypeEnum.EnvironmentalIncident]: 'Environmental incident',
  [AnomalyTypeEnum.SensorMismatch]: 'Sensor mismatch',
  [AnomalyTypeEnum.Undertemp]: 'Low temperature',
};

export function AssetAlertList({
  alerts,
  onPressAlert,
  limit,
}: {
  alerts: AlertDto[];
  onPressAlert: (id: string) => void;
  /** Shows at most `limit` newest alerts; the rest expand IN PLACE (no navigation away). */
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  // Newest first so the collapsed list still keeps the most important alerts.
  const sorted = useMemo(
    () =>
      [...alerts].sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
      ),
    [alerts],
  );

  const counts = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let info = 0;
    for (const a of alerts) {
      if (a.severity === AlertSeverityEnum.Critical) critical++;
      else if (a.severity === AlertSeverityEnum.Warning) warning++;
      else info++;
    }
    return { critical, warning, info };
  }, [alerts]);

  if (alerts.length === 0) {
    return (
      <View style={[styles.empty, Shadow]}>
        <Ionicons name="checkmark-circle-outline" size={28} color={Colors.primary} />
        <Text style={styles.emptyText}>No alerts</Text>
      </View>
    );
  }

  const capped = limit != null && !showAll;
  const shown = capped ? sorted.slice(0, limit) : sorted;
  const hidden = sorted.length - shown.length;
  const canCollapse = showAll && limit != null && sorted.length > limit;

  return (
    <View style={styles.wrap}>
      {/* Summary: total count + breakdown by severity */}
      <View style={styles.summary}>
        <Text style={styles.summaryTotal}>{alerts.length} alerts</Text>
        <View style={styles.summaryChips}>
          {counts.critical > 0 && (
            <SummaryChip color={Colors.danger} value={counts.critical} />
          )}
          {counts.warning > 0 && (
            <SummaryChip color={Colors.warning} value={counts.warning} />
          )}
          {counts.info > 0 && <SummaryChip color={Colors.info} value={counts.info} />}
        </View>
      </View>

      <View style={styles.list}>
        {shown.map((alert) => {
          const sev = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE[AlertSeverityEnum.Info];
          return (
            <Pressable
              key={alert.id}
              style={[styles.row, Shadow]}
              onPress={() => onPressAlert(alert.id)}
            >
              <View style={[styles.iconWrap, { backgroundColor: sev.bg }]}>
                <Ionicons name="alert-circle-outline" size={18} color={sev.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {ANOMALY_LABEL[alert.anomalyType] ?? 'Alert'}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {formatDateTime(alert.detectedAt)} · {STATUS_LABEL[alert.status] ?? ''}
                </Text>
              </View>
              <View style={[styles.sevPill, { backgroundColor: sev.bg }]}>
                <Text style={[styles.sevText, { color: sev.color }]}>{sev.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {hidden > 0 && (
        <Pressable style={styles.seeAll} onPress={() => setShowAll(true)}>
          <Text style={styles.seeAllText}>View all {alerts.length} alerts</Text>
          <Ionicons name="chevron-down" size={15} color={Solar.yellowDeep} />
        </Pressable>
      )}
      {canCollapse && (
        <Pressable style={styles.seeAll} onPress={() => setShowAll(false)}>
          <Text style={styles.seeAllText}>Collapse</Text>
          <Ionicons name="chevron-up" size={15} color={Solar.yellowDeep} />
        </Pressable>
      )}
    </View>
  );
}

function SummaryChip({ color, value }: { color: string; value: number }) {
  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={styles.chipText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTotal: { fontSize: 13, fontWeight: '700', color: Colors.textMute },
  summaryChips: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: '800', color: Colors.accent },

  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  meta: { fontSize: 11, color: Colors.textMute, marginTop: 2 },
  sevPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  sevText: { fontSize: 11, fontWeight: '800' },

  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 12,
  },
  seeAllText: { fontSize: 13, fontWeight: '800', color: Solar.yellowDeep },

  empty: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 13, color: Colors.textMute, fontWeight: '600' },
});
