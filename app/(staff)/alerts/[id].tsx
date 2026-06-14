import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../../../src/lib/theme';
import { useAlert } from '../../../src/features/batteries/hooks/useAlert';
import { ANOMALY_LABEL } from '../../../src/features/batteries/components/AssetAlertList';
import {
  AlertSeverityEnum,
  AlertStatusEnum,
} from '../../../src/shared/enums/alert.enum';

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

export default function StaffAlertDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: alert, isLoading, isError } = useAlert(id ?? '');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !alert) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={32} color={Colors.textFaint} />
        <Text style={styles.notFound}>Không tìm thấy cảnh báo</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const sev = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE[AlertSeverityEnum.Info];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết cảnh báo</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, Shadow]}>
          <View style={[styles.sevPill, { backgroundColor: sev.bg }]}>
            <Text style={[styles.sevText, { color: sev.color }]}>{sev.label}</Text>
          </View>
          <Text style={styles.title}>{ANOMALY_LABEL[alert.anomalyType] ?? 'Cảnh báo'}</Text>
          <Text style={styles.subtitle}>{alert.batterySerialNumber}</Text>
        </View>

        <View style={[styles.card, Shadow]}>
          <Row label="Trạng thái" value={STATUS_LABEL[alert.status] ?? '—'} />
          <Divider />
          <Row label="Ngưỡng" value={`${alert.thresholdValue} ${alert.unit}`} />
          <Divider />
          <Row label="Giá trị thực tế" value={`${alert.actualValue} ${alert.unit}`} />
          <Divider />
          <Row label="Phát hiện lúc" value={new Date(alert.detectedAt).toLocaleString()} />
          {alert.acknowledgedAt ? (
            <>
              <Divider />
              <Row label="Xác nhận lúc" value={new Date(alert.acknowledgedAt).toLocaleString()} />
            </>
          ) : null}
          {alert.resolvedAt ? (
            <>
              <Divider />
              <Row label="Xử lý lúc" value={new Date(alert.resolvedAt).toLocaleString()} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, gap: 10 },
  notFound: { fontSize: 16, fontWeight: '800', color: Colors.accent, marginTop: 8 },
  goBackBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  goBackText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  scroll: { padding: 20, paddingBottom: 60 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  sevPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 10 },
  sevText: { fontSize: 11, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  subtitle: { fontSize: 13, color: Colors.gray, fontWeight: '600', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 13, color: Colors.textMute, fontWeight: '600' },
  rowValue: { fontSize: 13, fontWeight: '800', color: Colors.accent, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)' },
});
