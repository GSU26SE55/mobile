import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Shadow } from '../../../src/lib/theme';
import { useAlerts } from '../../../src/features/batteries/hooks/useAlerts';
import { AlertDto, formatMeasure } from '../../../src/features/batteries/types/alert.types';
import { AlertSeverityEnum, AlertStatusEnum } from '../../../src/shared/enums/alert.enum';
import { ANOMALY_LABEL } from '../../../src/features/batteries/components/AssetAlertList';
import { useIncidents } from '../../../src/features/incidents/hooks/useIncidents';
import { IncidentList } from '../../../src/features/incidents/components/IncidentList';

type Segment = 'alerts' | 'incidents';

const SEVERITY_COLORS: Record<AlertSeverityEnum, { bg: string; iconColor: string }> = {
  [AlertSeverityEnum.Critical]: { bg: '#FFEBEA', iconColor: '#DC4F3D' },
  [AlertSeverityEnum.Warning]: { bg: '#FFF3E3', iconColor: '#FFB703' },
  [AlertSeverityEnum.Info]: { bg: '#EBF3FF', iconColor: '#5081C7' },
};

const STATUS_LABEL: Record<AlertStatusEnum, string> = {
  [AlertStatusEnum.Open]: 'Mở',
  [AlertStatusEnum.Acknowledged]: 'Đã xác nhận',
  [AlertStatusEnum.Merged]: 'Đã gộp',
  [AlertStatusEnum.Resolved]: 'Đã xử lý',
};

export default function StaffAlertsIncidentsScreen() {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('alerts');
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts();
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents();

  const renderAlert = ({ item }: { item: AlertDto }) => {
    const c = SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS[AlertSeverityEnum.Info];
    return (
      <Pressable
        style={[styles.card, Shadow]}
        onPress={() => router.push({ pathname: '/(staff)/alerts/[id]', params: { id: item.id } })}
      >
        <View style={[styles.iconWrap, { backgroundColor: c.bg }]}>
          <Ionicons name="alert-circle-outline" size={20} color={c.iconColor} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{ANOMALY_LABEL[item.anomalyType] ?? 'Cảnh báo'}</Text>
          <Text style={styles.meta}>
            {item.batterySerialNumber} · {STATUS_LABEL[item.status] ?? ''}
          </Text>
        </View>
        <Text style={[styles.value, { color: c.iconColor }]}>
          {formatMeasure(item.actualValue, item.unit)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>Cảnh báo & Sự cố</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segmentTab, segment === 'alerts' && styles.segmentTabActive]}
          onPress={() => setSegment('alerts')}
        >
          <Text style={[styles.segmentText, segment === 'alerts' && styles.segmentTextActive]}>
            Cảnh báo
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentTab, segment === 'incidents' && styles.segmentTabActive]}
          onPress={() => setSegment('incidents')}
        >
          <Text style={[styles.segmentText, segment === 'incidents' && styles.segmentTextActive]}>
            Sự cố
          </Text>
        </Pressable>
      </View>

      {segment === 'alerts' ? (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlert}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={alertsLoading ? 'hourglass-outline' : 'notifications-off-outline'}
                size={48}
                color={Colors.textFaint}
              />
              <Text style={styles.emptyText}>
                {alertsLoading ? 'Đang tải…' : 'Không có cảnh báo nào'}
              </Text>
            </View>
          }
        />
      ) : (
        <IncidentList
          data={incidents}
          isLoading={incidentsLoading}
          onPressItem={(id) =>
            router.push({ pathname: '/(staff)/incidents/[id]', params: { id } })
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
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
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  segmentTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segmentTabActive: { backgroundColor: '#34C759' },
  segmentText: { fontSize: 13, fontWeight: '700', color: Colors.textMute },
  segmentTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', color: Colors.text },
  meta: { fontSize: 11, color: Colors.textMute, marginTop: 3 },
  value: { fontSize: 14, fontWeight: '800', marginLeft: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.textMute },
});
