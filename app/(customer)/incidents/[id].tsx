import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDateTime } from '@/src/lib/date';
import { Colors, Shadow } from '@/src/lib/theme';
import { useIncident } from '@/src/features/incidents/hooks/useIncident';
import { IncidentStatusBadge } from '@/src/features/incidents/components/IncidentStatusBadge';
import { INCIDENT_TYPE_LABEL } from '@/src/features/incidents/types/incident.types';
import { AlertSeverityEnum } from '@/src/shared/enums/alert.enum';
import { BackButton } from '@/src/shared/components/ScreenHeader';

const SEVERITY_STYLE: Record<AlertSeverityEnum, { label: string; color: string; bg: string }> = {
  [AlertSeverityEnum.Info]: { label: 'Info', color: Colors.info, bg: Colors.infoLight },
  [AlertSeverityEnum.Warning]: { label: 'Warning', color: Colors.warningDark, bg: Colors.warningLight },
  [AlertSeverityEnum.Critical]: { label: 'Critical', color: Colors.danger, bg: Colors.dangerLight },
};

// Customer — incident detail is READ-ONLY (acknowledge/resolve is Staff-only, BE 403).
export default function CustomerIncidentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: incident, isLoading, isError } = useIncident(id ?? '');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !incident) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={32} color={Colors.textFaint} />
        <Text style={styles.notFound}>Incident not found</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const sev = SEVERITY_STYLE[incident.severity] ?? SEVERITY_STYLE[AlertSeverityEnum.Info];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackButton />
        <Text style={styles.headerTitle}>Incident Detail</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, Shadow]}>
          <View style={styles.pillRow}>
            <View style={[styles.sevPill, { backgroundColor: sev.bg }]}>
              <Text style={[styles.sevText, { color: sev.color }]}>{sev.label}</Text>
            </View>
            <IncidentStatusBadge status={incident.status} />
          </View>
          <Text style={styles.title}>{INCIDENT_TYPE_LABEL[incident.incidentType] ?? 'Incident'}</Text>
        </View>

        <View style={[styles.card, Shadow]}>
          <Row label="Detected at" value={formatDateTime(incident.detectedAt)} />
          {incident.reportedBy ? (
            <>
              <Divider />
              <Row label="Reported by" value={incident.reportedBy} />
            </>
          ) : null}
          {incident.acknowledgedAt ? (
            <>
              <Divider />
              <Row label="Acknowledged at" value={formatDateTime(incident.acknowledgedAt)} />
            </>
          ) : null}
          {incident.resolvedAt ? (
            <>
              <Divider />
              <Row label="Resolved at" value={formatDateTime(incident.resolvedAt)} />
            </>
          ) : null}
          {incident.resolutionNote ? (
            <>
              <Divider />
              <Row label="Resolution note" value={incident.resolutionNote} />
            </>
          ) : null}
          {incident.falseAlarmReason ? (
            <>
              <Divider />
              <Row label="False alarm reason" value={incident.falseAlarmReason} />
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
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: 18, marginBottom: 16 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sevPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  sevText: { fontSize: 11, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 13, color: Colors.textMute, fontWeight: '600' },
  rowValue: { fontSize: 13, fontWeight: '800', color: Colors.accent, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)' },
});
