import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { formatDateTime } from '@/src/lib/date';
import { Colors, Shadow } from '@/src/lib/theme';
import { KEY } from '@/src/lib/queryKeys';
import { useAlert } from '@/src/features/batteries/hooks/useAlert';
import { alertService } from '@/src/features/batteries/services/alert.service';
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
  [AlertStatusEnum.Open]: 'Open',
  [AlertStatusEnum.Acknowledged]: 'Acknowledged',
  [AlertStatusEnum.Merged]: 'Merged',
  [AlertStatusEnum.Resolved]: 'Resolved',
};

export default function AlertDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: alert, isLoading, isError } = useAlert(id ?? '');
  const queryClient = useQueryClient();

  // Opening the screen on an Open alert acknowledges it right away, so the customer
  // doesn't have to tap a separate button before they can see it as handled. Calls the
  // service directly (skipping useAcknowledgeAlert) so this silent step stays silent —
  // no error Alert, no success popup.
  const autoAckedId = useRef<string | null>(null);
  useEffect(() => {
    if (
      alert &&
      alert.status === AlertStatusEnum.Open &&
      autoAckedId.current !== alert.id
    ) {
      autoAckedId.current = alert.id;
      alertService
        .acknowledge(alert.id)
        .then(() => queryClient.invalidateQueries({ queryKey: KEY.alerts }))
        .catch(() => {
          // Silent by design — the reviewer never asked for acknowledgement, so a
          // failure here shouldn't interrupt them from reading the alert.
        });
    }
  }, [alert, queryClient]);

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
        <Text style={styles.notFound}>Alert not found</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const sev = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE[AlertSeverityEnum.Info];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackButton />
        <Text style={styles.headerTitle}>Alert details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, Shadow]}>
          <View style={[styles.sevPill, { backgroundColor: sev.bg }]}>
            <Text style={[styles.sevText, { color: sev.color }]}>{sev.label}</Text>
          </View>
          <Text style={styles.title}>{ANOMALY_LABEL[alert.anomalyType] ?? 'Alert'}</Text>
          <Text style={styles.subtitle}>{alert.batterySerialNumber}</Text>
        </View>

        <View style={[styles.card, Shadow]}>
          <Row label="Status" value={STATUS_LABEL[alert.status] ?? '—'} />
          <Divider />
          <Row label="Threshold" value={formatMeasure(alert.thresholdValue, alert.unit)} />
          <Divider />
          <Row label="Actual value" value={formatMeasure(alert.actualValue, alert.unit)} />
          <Divider />
          <Row label="Detected at" value={formatDateTime(alert.detectedAt)} />
          {alert.acknowledgedAt ? (
            <>
              <Divider />
              <Row label="Acknowledged at" value={formatDateTime(alert.acknowledgedAt)} />
            </>
          ) : null}
          {alert.resolvedAt ? (
            <>
              <Divider />
              <Row label="Resolved at" value={formatDateTime(alert.resolvedAt)} />
            </>
          ) : null}
        </View>

        {/* Battery link */}
        <Pressable
          style={[styles.linkCard, Shadow]}
          onPress={() =>
            router.push({ pathname: '/(customer)/batteries/[id]', params: { id: alert.batteryAssetId } })
          }
        >
          <View style={[styles.miniIconWrap, { backgroundColor: '#FFE5DA' }]}>
            <Ionicons name="battery-charging" size={16} color="#FF5E13" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>{alert.batterySerialNumber}</Text>
            <Text style={styles.linkMeta}>View battery details</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
        </Pressable>

        {/* Ticket link */}
        {alert.ticketId ? (
          <Pressable
            style={[styles.linkCard, Shadow]}
            onPress={() =>
              router.push({ pathname: '/(customer)/tickets/[id]', params: { id: alert.ticketId as string } })
            }
          >
            <View style={[styles.miniIconWrap, { backgroundColor: '#EBF3FF' }]}>
              <Ionicons name="ticket" size={16} color="#5081C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Linked ticket</Text>
              <Text style={styles.linkMeta}>Tap to open details</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
          </Pressable>
        ) : null}
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
  scroll: { padding: 20 },
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: 18, marginBottom: 16 },
  sevPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 10 },
  sevText: { fontSize: 11, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  subtitle: { fontSize: 13, color: Colors.gray, fontWeight: '600', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 13, color: Colors.textMute, fontWeight: '600' },
  rowValue: { fontSize: 13, fontWeight: '800', color: Colors.accent, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)' },
  linkCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  miniIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkTitle: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  linkMeta: { fontSize: 11, color: Colors.textMute, marginTop: 3 },
});
