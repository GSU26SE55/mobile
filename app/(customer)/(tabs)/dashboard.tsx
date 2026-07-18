import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { BadgeColors, Colors } from '../../../src/lib/theme';
import { HomeHeader } from '../../../src/shared/components/HomeHeader';
import { FleetOverview, Tone } from '../../../src/shared/components/StatTrio';
import { ProgressListItem } from '../../../src/shared/components/ProgressListItem';

// Màu theo mức SOC — giữ palette hiện tại (xanh primary / cam warning / đỏ danger).
function socColor(soc: number | null): string {
  if (soc == null) return Colors.gray;
  // Accent trang trí: SOC còn dùng được → xanh lá; chỉ khi cạn (<20%) mới đỏ.
  if (soc >= 20) return Colors.primary;
  return Colors.danger;
}

// Tone sức khỏe 1 pin — nguồn chân lý duy nhất cho cả badge lẫn card overview.
// crit: pin ngừng dùng | warn: nóng >45°C hoặc SOC <20% | ok: còn lại.
function batteryTone(item: BatteryAssetDto, live?: LiveReadingDto): Tone {
  if (item.status === 3) return 'crit';
  if (live && (live.temperature > 45 || live.socPercent < 20)) return 'warn';
  return 'ok';
}

// Trạng thái sức khỏe pin → badge + màu chấm/thanh (dùng cho list item).
function batteryHealth(item: BatteryAssetDto, live?: LiveReadingDto) {
  if (item.status === 3)
    return { label: 'Ngừng dùng', bg: BadgeColors.crit.bg, text: BadgeColors.crit.text, color: Colors.danger };
  if (item.status === 2)
    return { label: 'Tạm ngưng', bg: Colors.card3, text: Colors.textMute, color: Colors.gray };
  if (live && (live.temperature > 45 || live.socPercent < 20))
    return { label: 'Cần kiểm tra', bg: BadgeColors.warn.bg, text: BadgeColors.warn.text, color: Colors.warning };
  return { label: 'Tốt', bg: BadgeColors.ok.bg, text: BadgeColors.ok.text, color: Colors.primary };
}

// Xếp hạng tone để so sánh "xấu nhất" và sort list.
const TONE_RANK: Record<Tone, number> = { crit: 0, warn: 1, ok: 2 };

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { data: account, isLoading: profileLoading } = useProfile();
  const { data: batteries = [], isLoading: batteriesLoading } = useMyBatteryAssets();
  const { data: alerts = [] } = useMyAlerts();
  const { data: sites = [] } = useMySites();

  // GH-58 — realtime nhiều pin qua SSE summary scope `customer:{accountId}`.
  const user = useSessionStore((s) => s.user);
  const fleetScope = useMemo(
    () => (user ? buildFleetScope(user.role, { accountId: user.accountId }) : null),
    [user],
  );
  const { liveByAsset } = useBatteryFleetStream(fleetScope);

  const openAlertsCount = alerts.filter((a) => a.status === AlertStatusEnum.Open).length;

  // Tổng quan đội pin — "đèn báo trạng thái" theo pin xấu nhất, thay cho trung bình cộng.
  const overview = useMemo(() => {
    const withTone = batteries.map((b) => {
      const live = liveByAsset.get(b.id);
      return { battery: b, live, tone: batteryTone(b, live) };
    });
    const lives = withTone
      .map((x) => x.live)
      .filter((l): l is LiveReadingDto => !!l);

    const goodCount = withTone.filter((x) => x.tone === 'ok').length;
    const cardTone: Tone = withTone.reduce<Tone>(
      (worst, x) => (TONE_RANK[x.tone] < TONE_RANK[worst] ? x.tone : worst),
      'ok',
    );

    // Cực trị: pin yếu nhất (min SOC) + pin nóng nhất (max temp) — cái đáng lo nằm ở cực trị.
    const minSoc = lives.length ? Math.min(...lives.map((l) => l.socPercent)) : null;
    const maxTemp = lives.length ? Math.max(...lives.map((l) => l.temperature)) : null;

    const critCount = withTone.filter((x) => x.tone === 'crit').length;
    const warnCount = withTone.filter((x) => x.tone === 'warn').length;
    const statusLabel =
      critCount > 0
        ? `${critCount} pin cần xử lý ngay`
        : warnCount > 0
          ? `${warnCount} pin cần kiểm tra`
          : 'Hệ thống bình thường';

    // Pin bất thường (tone xấu) lên đầu list.
    const sorted = [...withTone]
      .sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone])
      .map((x) => x.battery);

    return { goodCount, cardTone, minSoc, maxTemp, statusLabel, sorted };
  }, [batteries, liveByAsset]);

  if (profileLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const firstName = account?.fullName ? account.fullName.split(' ').slice(-1)[0] : 'bạn';

  return (
    <View style={styles.root}>
      <FlatList
        data={overview.sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <HomeHeader
              name={firstName}
              subtitle="Hệ thống pin mặt trời"
              avatarUrl={account?.avatarUrl}
              showDot={openAlertsCount > 0}
              onBellPress={() => router.push('/(customer)/(tabs)/alerts')}
            />

            {/* Tổng quan hệ thống — đèn báo trạng thái theo pin xấu nhất */}
            <FleetOverview
              tone={overview.cardTone}
              gauge={{ goodCount: overview.goodCount, total: batteries.length }}
              boxes={[
                {
                  icon: 'battery-half-outline',
                  label: 'Pin yếu nhất',
                  value: overview.minSoc != null ? `${Math.round(overview.minSoc)}%` : '—',
                  color: overview.minSoc != null && overview.minSoc < 20 ? Colors.warning : undefined,
                  barPercent: overview.minSoc ?? undefined,
                },
                {
                  icon: 'thermometer-outline',
                  label: 'Nhiệt cao nhất',
                  value: overview.maxTemp != null ? `${Math.round(overview.maxTemp)}°C` : '—',
                  color: overview.maxTemp != null && overview.maxTemp > 45 ? Colors.warning : undefined,
                },
              ]}
              statusLabel={overview.statusLabel}
            />

            {/* Sites overview — ẩn nếu customer chưa có site nào */}
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
                    onPress={() => router.push({ pathname: '/(customer)/sites/[id]', params: { id: site.id } })}
                  />
                ))}
              </>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Các cục pin</Text>
              <Text style={styles.sectionCount}>{batteries.length}</Text>
            </View>

            {batteriesLoading && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
            )}
          </>
        }
        renderItem={({ item }) => {
          const live = liveByAsset.get(item.id);
          const health = batteryHealth(item, live);
          const caption = live
            ? `${live.socPercent.toFixed(0)}% · ${live.voltage.toFixed(1)}V · ${live.temperature.toFixed(0)}°C`
            : item.serialNumber;
          return (
            <ProgressListItem
              title={item.batteryTypeName || item.serialNumber}
              dotColor={health.color}
              badge={{ label: health.label, bg: health.bg, text: health.text }}
              percent={live?.socPercent ?? 0}
              barColor={live ? socColor(live.socPercent) : Colors.graySoft}
              caption={caption}
              onPress={() => router.push({ pathname: '/(customer)/batteries/[id]', params: { id: item.id } })}
            />
          );
        }}
        ListEmptyComponent={
          !batteriesLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="battery-dead-outline" size={48} color={Colors.gray} />
              <Text style={styles.emptyTitle}>Chưa có pin nào</Text>
              <Text style={styles.emptySub}>Các cục pin sẽ xuất hiện ở đây khi được gán cho bạn.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<PopularKbSection limit={5} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  sectionCount: { fontSize: 13, color: Colors.gray, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.accent, marginTop: 12 },
  emptySub: { fontSize: 13, color: Colors.gray, textAlign: 'center', marginTop: 6, paddingHorizontal: 40 },
});
