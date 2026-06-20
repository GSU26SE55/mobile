import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../lib/theme';
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
};

export function AssetAlertList({
  alerts,
  onPressAlert,
}: {
  alerts: AlertDto[];
  onPressAlert: (id: string) => void;
}) {
  if (alerts.length === 0) {
    return (
      <View style={[styles.empty, Shadow]}>
        <Ionicons name="checkmark-circle-outline" size={28} color={Colors.gray} />
        <Text style={styles.emptyText}>Không có cảnh báo</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {alerts.map((alert) => {
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
              <Text style={styles.title}>{ANOMALY_LABEL[alert.anomalyType] ?? 'Cảnh báo'}</Text>
              <Text style={styles.meta}>
                {new Date(alert.detectedAt).toLocaleString()} · {STATUS_LABEL[alert.status] ?? ''}
              </Text>
            </View>
            <View style={[styles.sevPill, { backgroundColor: sev.bg }]}>
              <Text style={[styles.sevText, { color: sev.color }]}>{sev.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
  empty: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 13, color: Colors.textMute, fontWeight: '600' },
});
