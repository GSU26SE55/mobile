import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Shadow } from '../../../src/lib/theme';
import { useMyAlerts } from '../../../src/features/batteries/hooks/useMyAlerts';
import { AlertDto, formatMeasure } from '../../../src/features/batteries/types/alert.types';
import {
  AlertSeverityEnum,
  AlertStatusEnum,
} from '../../../src/shared/enums/alert.enum';
import { ANOMALY_LABEL } from '../../../src/features/batteries/components/AssetAlertList';
import { useMyIncidents } from '../../../src/features/incidents/hooks/useMyIncidents';
import { IncidentList } from '../../../src/features/incidents/components/IncidentList';

type FilterKey = 'all' | AlertSeverityEnum;
type Segment = 'alerts' | 'incidents';

const SEVERITY_COLORS: Record<AlertSeverityEnum, { label: string; bg: string; iconColor: string; badgeBg: string; badgeText: string }> = {
  [AlertSeverityEnum.Critical]: { label: 'CRITICAL', bg: '#FFEBEA', iconColor: '#DC4F3D', badgeBg: '#FFE5E3', badgeText: '#B73221' },
  [AlertSeverityEnum.Warning]: { label: 'WARNING', bg: '#FFF3E3', iconColor: '#FFB703', badgeBg: '#FFF1B8', badgeText: '#9C7800' },
  [AlertSeverityEnum.Info]: { label: 'INFO', bg: '#EBF3FF', iconColor: '#5081C7', badgeBg: '#DCE6F5', badgeText: '#2A538A' },
};

const STATUS_LABEL: Record<AlertStatusEnum, string> = {
  [AlertStatusEnum.Open]: 'Mở',
  [AlertStatusEnum.Acknowledged]: 'Đã xác nhận',
  [AlertStatusEnum.Merged]: 'Đã gộp',
  [AlertStatusEnum.Resolved]: 'Đã xử lý',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: AlertSeverityEnum.Critical, label: 'Critical' },
  { key: AlertSeverityEnum.Warning, label: 'Warning' },
  { key: AlertSeverityEnum.Info, label: 'Info' },
];

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { data: alerts = [], isLoading } = useMyAlerts();
  const {
    data: incidents = [],
    isLoading: incidentsLoading,
    siteNameMap,
  } = useMyIncidents();
  const [segment, setSegment] = useState<Segment>('alerts');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const openCount = alerts.filter((a) => a.status === AlertStatusEnum.Open).length;
  const totalCount = alerts.length;

  const filteredAlerts = alerts.filter((alert) =>
    activeFilter === 'all' ? true : alert.severity === activeFilter,
  );

  const renderAlertItem = ({ item }: { item: AlertDto }) => {
    const colors = SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS[AlertSeverityEnum.Info];

    return (
      <Pressable
        style={[styles.card, Shadow]}
        onPress={() => router.push({ pathname: '/(customer)/alerts/[id]', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.iconColor} />
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.tagRow}>
              <View style={[styles.typeBadge, { backgroundColor: colors.badgeBg }]}>
                <View style={[styles.badgeDot, { backgroundColor: colors.badgeText }]} />
                <Text style={[styles.typeBadgeText, { color: colors.badgeText }]}>{colors.label}</Text>
              </View>
              {item.status === AlertStatusEnum.Open && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.alertTitle}>{ANOMALY_LABEL[item.anomalyType] ?? 'Cảnh báo'}</Text>
            <Text style={styles.alertMeta}>
              {item.batterySerialNumber} · {STATUS_LABEL[item.status] ?? ''}
            </Text>
          </View>
          <View style={styles.valueWrap}>
            <Text style={[styles.valText, { color: colors.badgeText }]}>
              {formatMeasure(item.actualValue, item.unit)}
            </Text>
            <Text style={styles.thrText}>
              thr {formatMeasure(item.thresholdValue, item.unit)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Cảnh báo</Text>
          <Text style={styles.subtitle}>
            {openCount} đang mở · {totalCount} tổng
          </Text>
        </View>
      </View>

      {/* Segment: Cảnh báo | Sự cố */}
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
        <>
          {/* Filter Horizontal Row */}
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {FILTERS.map((f) => (
                <Pressable
                  key={String(f.key)}
                  style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
                  onPress={() => setActiveFilter(f.key)}
                >
                  <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Alerts List */}
          <FlatList
            data={filteredAlerts}
            keyExtractor={(item) => item.id}
            renderItem={renderAlertItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={isLoading ? 'hourglass-outline' : 'notifications-off-outline'}
                  size={48}
                  color={Colors.textFaint}
                />
                <Text style={styles.emptyText}>
                  {isLoading ? 'Đang tải…' : 'Không có cảnh báo nào'}
                </Text>
              </View>
            }
          />
        </>
      ) : (
        <IncidentList
          data={incidents}
          isLoading={incidentsLoading}
          siteNameMap={siteNameMap}
          onPressItem={(id) =>
            router.push({ pathname: '/(customer)/incidents/[id]', params: { id } })
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
    paddingBottom: 14,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.textMute, marginTop: 2 },
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
  filterContainer: { marginBottom: 14 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },
  filterTabActive: { backgroundColor: '#34C759' },
  filterText: { fontSize: 12, fontWeight: '700', color: Colors.textMute },
  filterTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 20, paddingBottom: 110 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: { flex: 1 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDot: { width: 4, height: 4, borderRadius: 2 },
  typeBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.3 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' },
  alertTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  alertMeta: { fontSize: 11, color: Colors.textMute, marginTop: 3 },
  valueWrap: { alignItems: 'flex-end', marginLeft: 12 },
  valText: { fontSize: 14, fontWeight: '800' },
  thrText: { fontSize: 10, color: Colors.textMute, marginTop: 3 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.textMute },
});
