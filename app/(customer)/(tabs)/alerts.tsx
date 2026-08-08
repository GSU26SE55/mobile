import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Solar } from '@/src/lib/theme';
import { useMyAlerts } from '@/src/features/batteries/hooks/useMyAlerts';
import { AlertDto, formatMeasure } from '@/src/features/batteries/types/alert.types';
import {
  AlertSeverityEnum,
  AlertStatusEnum,
} from '@/src/shared/enums/alert.enum';
import { ANOMALY_LABEL } from '@/src/features/batteries/components/AssetAlertList';
import { useMyIncidents } from '@/src/features/incidents/hooks/useMyIncidents';
import { IncidentList } from '@/src/features/incidents/components/IncidentList';
import { EnergyBackdrop, GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';
import { BackButton } from '@/src/shared/components/ScreenHeader';

type FilterKey = 'all' | AlertSeverityEnum;
type Segment = 'alerts' | 'incidents';

const SEVERITY_COLORS: Record<AlertSeverityEnum, { label: string; bg: string; iconColor: string; badgeBg: string; badgeText: string }> = {
  [AlertSeverityEnum.Critical]: { label: 'CRITICAL', bg: '#FFEBEA', iconColor: '#DC4F3D', badgeBg: '#FFE5E3', badgeText: '#B73221' },
  [AlertSeverityEnum.Warning]: { label: 'WARNING', bg: '#FFF6D6', iconColor: '#D9A000', badgeBg: '#FFF1B8', badgeText: '#9C7800' },
  [AlertSeverityEnum.Info]: { label: 'INFO', bg: '#EBF3FF', iconColor: '#5081C7', badgeBg: '#DCE6F5', badgeText: '#2A538A' },
};

const STATUS_LABEL: Record<AlertStatusEnum, string> = {
  [AlertStatusEnum.Open]: 'Open',
  [AlertStatusEnum.Acknowledged]: 'Acknowledged',
  [AlertStatusEnum.Merged]: 'Merged',
  [AlertStatusEnum.Resolved]: 'Resolved',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
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
        onPress={() => router.push({ pathname: '/(customer)/alerts/[id]', params: { id: item.id } })}
      >
        {({ pressed }) => (
          <GlassSurface style={[styles.card, pressed && styles.pressed]}>
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
                <Text style={styles.alertTitle}>{ANOMALY_LABEL[item.anomalyType] ?? 'Alert'}</Text>
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
          </GlassSurface>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <EnergyBackdrop />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {router.canGoBack() && (
          <BackButton />
        )}
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Alerts & Incidents</Text>
          <Text style={styles.subtitle}>
            {openCount} open · {totalCount} total
          </Text>
        </View>
      </View>

      {/* Segment: Alerts | Incidents */}
      <View style={styles.segmentRowWrap}>
        <GlassSurface style={styles.segmentRow}>
          <Pressable
            style={[styles.segmentTab, segment === 'alerts' && styles.segmentTabActive]}
            onPress={() => setSegment('alerts')}
          >
            <Text style={[styles.segmentText, segment === 'alerts' && styles.segmentTextActive]}>
              Alerts
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentTab, segment === 'incidents' && styles.segmentTabActive]}
            onPress={() => setSegment('incidents')}
          >
            <Text style={[styles.segmentText, segment === 'incidents' && styles.segmentTextActive]}>
              Incidents
            </Text>
          </Pressable>
        </GlassSurface>
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
                <GlassSurface style={styles.emptyCard}>
                  <Ionicons
                    name={isLoading ? 'hourglass-outline' : 'notifications-off-outline'}
                    size={45}
                    color={Solar.faint}
                  />
                  <Text style={styles.emptyText}>
                    {isLoading ? 'Loading…' : 'No alerts'}
                  </Text>
                </GlassSurface>
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
  container: { flex: 1, backgroundColor: Solar.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerLeft: { flex: 1 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#8C7A4B',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: '900', color: Solar.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Solar.mute, marginTop: 2, fontWeight: '600' },
  segmentRowWrap: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  segmentTab: { flex: 1, paddingVertical: 9, borderRadius: 14, alignItems: 'center' },
  segmentTabActive: {
    backgroundColor: Solar.yellow,
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  segmentText: { fontSize: 13, fontWeight: '700', color: Solar.mute },
  segmentTextActive: { color: Solar.ink, fontWeight: '900' },
  filterContainer: { marginBottom: 14 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 215, 0.7)',
  },
  filterTabActive: {
    backgroundColor: Solar.yellow,
    borderWidth: 0,
  },
  filterText: { fontSize: 12, fontWeight: '700', color: Solar.mute },
  filterTextActive: { color: Solar.ink, fontWeight: '900' },
  list: { paddingHorizontal: 20, paddingBottom: 110 },
  card: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
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
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.danger },
  alertTitle: { fontSize: 14, fontWeight: '900', color: Solar.ink },
  alertMeta: { fontSize: 11, color: Solar.mute, marginTop: 3, fontWeight: '600' },
  valueWrap: { alignItems: 'flex-end', marginLeft: 12 },
  valText: { fontSize: 14, fontWeight: '900' },
  thrText: { fontSize: 10, color: Solar.mute, marginTop: 3, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, width: '100%' },
  emptyCard: { borderRadius: 24, padding: 30, alignItems: 'center', width: '100%' },
  emptyText: { fontSize: 13, color: Solar.mute, fontWeight: '600', marginTop: 8 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
