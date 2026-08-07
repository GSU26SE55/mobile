import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '@/src/lib/theme';
import { handleErrorApi } from '@/src/lib/errors';
import { useAlert } from '@/src/features/batteries/hooks/useAlert';
import { useResolveAlert } from '@/src/features/batteries/hooks/useResolveAlert';
import { ANOMALY_LABEL } from '@/src/features/batteries/components/AssetAlertList';
import { formatMeasure } from '@/src/features/batteries/types/alert.types';
import {
  AlertSeverityEnum,
  AlertStatusEnum,
} from '@/src/shared/enums/alert.enum';
import { BackButton } from '@/src/shared/components/ScreenHeader';

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
  const { mutateAsync: resolve, isPending: resolvePending } = useResolveAlert();

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
  // Resolve hợp lệ khi Open/Acknowledged. Merged/Resolved → ẩn nút.
  const canResolve =
    alert.status === AlertStatusEnum.Open || alert.status === AlertStatusEnum.Acknowledged;

  const handleResolve = async () => {
    try {
      await resolve(alert.id);
      Alert.alert('Thành công', 'Đã xử lý cảnh báo này.');
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackButton />
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
          <Row label="Ngưỡng" value={formatMeasure(alert.thresholdValue, alert.unit)} />
          <Divider />
          <Row label="Giá trị thực tế" value={formatMeasure(alert.actualValue, alert.unit)} />
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

      {canResolve && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[styles.resolveBtn, Shadow]}
            onPress={handleResolve}
            disabled={resolvePending}
          >
            {resolvePending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.resolveText}>Resolve</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
  },
  resolveText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
});
