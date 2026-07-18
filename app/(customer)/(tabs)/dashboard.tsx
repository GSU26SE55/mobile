import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { useProfile } from '../../../src/features/profile/hooks/useProfile';
import { useMyBatteryAssets } from '../../../src/features/batteries/hooks/useMyBatteryAssets';
import { useMyAlerts } from '../../../src/features/batteries/hooks/useMyAlerts';
import { useBatteryFleetStream } from '../../../src/features/batteries/hooks/useBatteryFleetStream';
import { buildFleetScope } from '../../../src/features/batteries/utils/buildFleetScope';
import { useMySites } from '../../../src/features/sites/hooks/useMySites';
import { SiteCard } from '../../../src/features/sites/components/SiteCard';
import { AlertStatusEnum } from '../../../src/shared/enums/alert.enum';
import { BatteryAssetDto } from '../../../src/features/batteries/types/battery.types';
import { LiveReadingDto } from '../../../src/features/batteries/types/live-reading.types';
import { useSessionStore } from '../../../src/stores/sessionStore';
import { PopularKbSection } from '../../../src/features/kb/components/PopularKbSection';
import { Colors, Shadow, Solar } from '../../../src/lib/theme';

// Chấm sức khỏe pin — giữ ngữ nghĩa (xanh tốt / cam cần kiểm tra / đỏ ngừng).
function healthDot(item: BatteryAssetDto, live?: LiveReadingDto): string {
  if (item.status === 3) return Colors.danger;
  if (item.status === 2) return Solar.faint;
  if (live && (live.temperature > 45 || live.socPercent < 20)) return Colors.warning;
  return Colors.success;
}

const avg = (arr: number[]): number | null =>
  arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;

function todayLabel(): string {
  const s = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { data: account, isLoading: profileLoading } = useProfile();
  const { data: batteries = [], isLoading: batteriesLoading } = useMyBatteryAssets();
  const { data: alerts = [] } = useMyAlerts();
  const { data: sites = [] } = useMySites();
  const [waveWidth, setWaveWidth] = useState(0);

  // GH-58 — realtime nhiều pin qua SSE summary scope `customer:{accountId}`.
  const user = useSessionStore((s) => s.user);
  const fleetScope = useMemo(
    () => (user ? buildFleetScope(user.role, { accountId: user.accountId }) : null),
    [user],
  );
  const { liveByAsset } = useBatteryFleetStream(fleetScope);

  const openAlertsCount = alerts.filter((a) => a.status === AlertStatusEnum.Open).length;

  // Tổng hợp telemetry toàn hệ thống pin (chỉ từ những pin có reading live).
  const lives = batteries
    .map((b) => liveByAsset.get(b.id))
    .filter((l): l is LiveReadingDto => !!l);
  const avgSoc = avg(lives.map((l) => l.socPercent));
  const avgVolt = avg(lives.map((l) => l.voltage));
  const avgTemp = avg(lives.map((l) => l.temperature));

  // Đường sóng trên card kem: SOC hiện tại của từng pin (theo thứ tự danh sách).
  const wavePoints = useMemo(
    () =>
      batteries
        .map((b) => liveByAsset.get(b.id))
        .filter((l): l is LiveReadingDto => !!l)
        .map((l) => ({ value: l.socPercent })),
    [batteries, liveByAsset],
  );

  if (profileLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Solar.yellowDeep} />
      </View>
    );
  }

  const firstName = account?.fullName ? account.fullName.split(' ').slice(-1)[0] : 'bạn';
  const countLabel = batteries.length > 0 ? String(batteries.length).padStart(2, '0') : '0';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 14 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — lời chào lớn bên trái + chuông trắng bên phải */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting} numberOfLines={1}>
              Chào {firstName}
            </Text>
            <Text style={styles.dateLine} numberOfLines={1}>
              {todayLabel()}
            </Text>
          </View>
          <Pressable
            style={styles.bell}
            onPress={() => router.push('/(customer)/(tabs)/alerts')}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={20} color={Solar.ink} />
            {openAlertsCount > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>

        {/* Hero — số liệu tổng lớn + biểu tượng pin mặt trời */}
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroValue}>
              {avgSoc != null ? `${Math.round(avgSoc)}%` : '—'}
            </Text>
            <Text style={styles.heroLabel}>Tổng dung lượng pin</Text>
          </View>
          <View style={styles.heroArt}>
            <Ionicons name="battery-charging" size={56} color={Solar.yellow} />
            <Ionicons name="sunny" size={22} color={Solar.yellowDeep} style={styles.heroSun} />
          </View>
        </View>

        {/* Card kem: số lượng pin + đường sóng SOC */}
        <View style={styles.waveCard}>
          <View style={styles.waveTop}>
            <View>
              <Text style={styles.waveCaption}>Số lượng pin</Text>
              <Text style={styles.waveCount}>{countLabel} Pin</Text>
            </View>
            <View style={styles.wavePill}>
              <View style={styles.wavePillDot} />
              <Text style={styles.wavePillText}>Trực tiếp</Text>
            </View>
          </View>

          <View onLayout={(e: LayoutChangeEvent) => setWaveWidth(e.nativeEvent.layout.width)}>
            {wavePoints.length >= 2 && waveWidth > 0 ? (
              <LineChart
                data={wavePoints}
                height={72}
                width={waveWidth}
                adjustToWidth
                initialSpacing={4}
                endSpacing={4}
                curved
                thickness={2.5}
                color={Solar.yellow}
                areaChart
                startFillColor={Solar.yellow}
                endFillColor={Solar.cardCream}
                startOpacity={0.35}
                endOpacity={0.02}
                hideDataPoints={wavePoints.length > 10}
                dataPointsColor={Solar.yellowDeep}
                dataPointsRadius={3}
                hideAxesAndRules
                hideYAxisText
                yAxisLabelWidth={0}
                xAxisLabelsHeight={0}
                disableScroll
                maxValue={100}
              />
            ) : (
              <View style={styles.waveEmpty}>
                <Text style={styles.waveEmptyText}>
                  {batteriesLoading ? 'Đang tải dữ liệu…' : 'Chưa có dữ liệu realtime'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 3 chip thống kê — chip đầu vàng active như thiết kế */}
        <View style={styles.statRow}>
          <View style={[styles.statChip, styles.statChipActive]}>
            <Text style={styles.statChipLabel}>Dung lượng</Text>
            <Text style={styles.statChipValue}>
              {avgSoc != null ? `${Math.round(avgSoc)}%` : '—'}
            </Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>Điện áp</Text>
            <Text style={styles.statChipValue}>
              {avgVolt != null ? `${avgVolt.toFixed(1)}V` : '—'}
            </Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>Nhiệt độ</Text>
            <Text style={styles.statChipValue}>
              {avgTemp != null ? `${Math.round(avgTemp)}°C` : '—'}
            </Text>
          </View>
        </View>

        {/* Các cục pin — thẻ ngang như hàng "Panels" */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Các cục pin</Text>
          <Text style={styles.sectionCount}>{batteries.length} pin</Text>
        </View>

        {batteriesLoading ? (
          <ActivityIndicator size="small" color={Solar.yellowDeep} style={{ marginVertical: 20 }} />
        ) : batteries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="battery-dead-outline" size={48} color={Solar.faint} />
            <Text style={styles.emptyTitle}>Chưa có pin nào</Text>
            <Text style={styles.emptySub}>Các cục pin sẽ xuất hiện ở đây khi được gán cho bạn.</Text>
          </View>
        ) : (
          <FlatList
            data={batteries}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 24 }}
            contentContainerStyle={styles.panelRow}
            renderItem={({ item }) => {
              const live = liveByAsset.get(item.id);
              return (
                <Pressable
                  style={[styles.panelCard, Shadow]}
                  onPress={() =>
                    router.push({ pathname: '/(customer)/batteries/[id]', params: { id: item.id } })
                  }
                >
                  <View style={styles.panelTop}>
                    <Text style={styles.panelName} numberOfLines={1}>
                      {item.serialNumber}
                    </Text>
                    <View style={[styles.panelDot, { backgroundColor: healthDot(item, live) }]} />
                  </View>
                  <View style={styles.socChip}>
                    <Ionicons name="flash" size={11} color={Solar.yellowDeep} />
                    <Text style={styles.socChipText}>
                      {live ? `${Math.round(live.socPercent)}%` : '—'}
                    </Text>
                  </View>
                  <Text style={styles.panelValue}>
                    {live ? `${live.voltage.toFixed(1)}V` : '—'}
                  </Text>
                  <Text style={styles.panelCaption} numberOfLines={1}>
                    {item.batteryTypeName || 'Điện áp'}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}

        {/* Trạm của tôi — ẩn nếu customer chưa có site nào */}
        {sites.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trạm của tôi</Text>
              <Text style={styles.sectionCount}>{sites.length}</Text>
            </View>
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                item={site}
                onPress={() =>
                  router.push({ pathname: '/(customer)/sites/[id]', params: { id: site.id } })
                }
              />
            ))}
          </>
        )}

        <PopularKbSection limit={5} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Solar.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Solar.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  greeting: { fontSize: 26, fontWeight: '800', color: Solar.ink, letterSpacing: -0.4 },
  dateLine: { fontSize: 12, color: Solar.mute, fontWeight: '600', marginTop: 3 },
  bell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Solar.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Solar.border,
  },
  bellDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },

  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  heroValue: { fontSize: 40, fontWeight: '800', color: Solar.ink, letterSpacing: -1 },
  heroLabel: { fontSize: 13, color: Solar.mute, fontWeight: '600', marginTop: 2 },
  heroArt: {
    width: 96,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSun: { position: 'absolute', top: 4, right: 10 },

  waveCard: {
    backgroundColor: Solar.cardCream,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Solar.border,
  },
  waveTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  waveCaption: { fontSize: 12, color: Solar.mute, fontWeight: '600' },
  waveCount: { fontSize: 20, fontWeight: '800', color: Solar.ink, marginTop: 2 },
  wavePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Solar.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Solar.border,
  },
  wavePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Solar.yellow },
  wavePillText: { fontSize: 12, fontWeight: '700', color: Solar.ink },
  waveEmpty: { height: 72, alignItems: 'center', justifyContent: 'center' },
  waveEmptyText: { fontSize: 12, color: Solar.mute, fontWeight: '600' },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statChip: {
    flex: 1,
    backgroundColor: Solar.white,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Solar.border,
  },
  statChipActive: { backgroundColor: Solar.yellow, borderColor: Solar.yellow },
  statChipLabel: { fontSize: 11, color: Solar.ink2, fontWeight: '600' },
  statChipValue: { fontSize: 16, fontWeight: '800', color: Solar.ink, marginTop: 3 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Solar.ink },
  sectionCount: { fontSize: 13, color: Solar.mute, fontWeight: '600' },

  panelRow: { gap: 12, paddingBottom: 4 },
  panelCard: {
    width: 132,
    backgroundColor: Solar.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Solar.border,
  },
  panelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelName: { flex: 1, fontSize: 13, fontWeight: '800', color: Solar.ink, marginRight: 6 },
  panelDot: { width: 8, height: 8, borderRadius: 4 },
  socChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: Solar.yellowSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  socChipText: { fontSize: 11, fontWeight: '800', color: Solar.ink },
  panelValue: { fontSize: 18, fontWeight: '800', color: Solar.ink, marginTop: 14 },
  panelCaption: { fontSize: 11, color: Solar.mute, fontWeight: '600', marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Solar.ink, marginTop: 12 },
  emptySub: {
    fontSize: 13,
    color: Solar.mute,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 40,
  },
});
