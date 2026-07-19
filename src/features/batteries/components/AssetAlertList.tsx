import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Solar } from '../../../lib/theme';
import { AlertDto } from '../types/alert.types';
import {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from '../../../shared/enums/alert.enum';

const SEVERITY_STYLE: Record<AlertSeverityEnum, { label: string; color: string; bg: string }> = {
  [AlertSeverityEnum.Info]: { label: 'Info', color: Colors.info, bg: Colors.infoLight },
  [AlertSeverityEnum.Warning]: { label: 'Warning', color: Colors.warningDark, bg: Colors.warningLight },
  [AlertSeverityEnum.Critical]: { label: 'Critical', color: Colors.danger, bg: Colors.dangerLight },
};

const STATUS_LABEL: Record<AlertStatusEnum, string> = {
  [AlertStatusEnum.Open]: 'Mở',
  [AlertStatusEnum.Acknowledged]: 'Đã xác nhận',
  [AlertStatusEnum.Merged]: 'Đã gộp',
  [AlertStatusEnum.Resolved]: 'Đã xử lý',
};

export const ANOMALY_LABEL: Record<AnomalyTypeEnum, string> = {
  [AnomalyTypeEnum.Overheat]: 'Quá nhiệt',
  [AnomalyTypeEnum.Overvoltage]: 'Quá áp',
  [AnomalyTypeEnum.Undervoltage]: 'Sụt áp',
  [AnomalyTypeEnum.LowSoc]: 'SOC thấp',
  [AnomalyTypeEnum.RapidDischarge]: 'Xả nhanh',
  [AnomalyTypeEnum.AbnormalCharging]: 'Sạc bất thường',
  [AnomalyTypeEnum.DeviceOffline]: 'Thiết bị offline',
  [AnomalyTypeEnum.SohDegradation]: 'Suy giảm SOH',
  [AnomalyTypeEnum.HighAmbientTemp]: 'Nhiệt độ môi trường cao',
  [AnomalyTypeEnum.HighHumidity]: 'Độ ẩm cao',
  [AnomalyTypeEnum.HighTempHumidityCombo]: 'Nhiệt độ + độ ẩm cao',
  [AnomalyTypeEnum.HighInternalResistance]: 'Điện trở trong cao',
  [AnomalyTypeEnum.CellImbalance]: 'Mất cân bằng cell',
  [AnomalyTypeEnum.EnvironmentalIncident]: 'Sự cố môi trường',
  [AnomalyTypeEnum.SensorMismatch]: 'Lệch cảm biến',
  [AnomalyTypeEnum.Undertemp]: 'Nhiệt độ thấp',
};

function shortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AssetAlertList({
  alerts,
  onPressAlert,
  limit,
}: {
  alerts: AlertDto[];
  onPressAlert: (id: string) => void;
  /** Chỉ hiện tối đa `limit` cảnh báo mới nhất; phần còn lại mở rộng NGAY TẠI CHỖ (không rời màn). */
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  // Mới nhất lên đầu để list rút gọn vẫn giữ cảnh báo quan trọng nhất.
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
        <Text style={styles.emptyText}>Không có cảnh báo</Text>
      </View>
    );
  }

  const capped = limit != null && !showAll;
  const shown = capped ? sorted.slice(0, limit) : sorted;
  const hidden = sorted.length - shown.length;
  const canCollapse = showAll && limit != null && sorted.length > limit;

  return (
    <View style={styles.wrap}>
      {/* Tóm tắt: tổng số + phân theo mức */}
      <View style={styles.summary}>
        <Text style={styles.summaryTotal}>{alerts.length} cảnh báo</Text>
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
                  {ANOMALY_LABEL[alert.anomalyType] ?? 'Cảnh báo'}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {shortTime(alert.detectedAt)} · {STATUS_LABEL[alert.status] ?? ''}
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
          <Text style={styles.seeAllText}>Xem tất cả {alerts.length} cảnh báo</Text>
          <Ionicons name="chevron-down" size={15} color={Solar.yellowDeep} />
        </Pressable>
      )}
      {canCollapse && (
        <Pressable style={styles.seeAll} onPress={() => setShowAll(false)}>
          <Text style={styles.seeAllText}>Thu gọn</Text>
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
