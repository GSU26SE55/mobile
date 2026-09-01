import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollToTop } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/src/features/profile/hooks/useProfile';
import { useMyBatteryAssets } from '@/src/features/batteries/hooks/useMyBatteryAssets';
import { useUnreadCount } from '@/src/features/notifications/hooks/useNotifications';
import { useBatteryFleetStream } from '@/src/features/batteries/hooks/useBatteryFleetStream';
import { buildFleetScope } from '@/src/features/batteries/utils/buildFleetScope';
import { useMySites } from '@/src/features/sites/hooks/useMySites';
import { useAmbientLatest } from '@/src/features/ambient/hooks/useAmbientLatest';
import { useBlogInfiniteList } from '@/src/features/blog/hooks/useBlogInfiniteList';
import { useSessionStore } from '@/src/stores/sessionStore';
import { formatDate } from '@/src/lib/date';
import { Colors, Font, Radius, Solar } from '@/src/lib/theme';
import { EnergyBackdrop, GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';
import { EnergyFlowCard } from '@/src/features/batteries/components/EnergyFlowCard';
import { PressableScale } from '@/src/shared/components/motion';

const BATTERY_IMAGE = require('../../../assets/images/battery-storage-3d.png');

// Li-ion derating starts around 35 °C and 45 °C is a fault on every pack we ship,
// so the badge is a reading AND a warning.
const tempTint = (c: number) => (c >= 45 ? Colors.dangerDark : c >= 35 ? Colors.warningDark : Solar.ink);

function useLiveWeather(siteId?: string, lat?: number | null, lon?: number | null) {
  const { data: ambient } = useAmbientLatest(siteId ?? '');

  const openMeteoQuery = useQuery({
    queryKey: ['openMeteoWeather', lat, lon],
    queryFn: async () => {
      const latitude = lat ?? 10.7769;
      const longitude = lon ?? 106.7009;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json?.current_weather as { temperature: number; weathercode: number } | null;
    },
    enabled: !ambient,
    staleTime: 10 * 60 * 1000,
  });

  const temp = ambient?.ambientTemperature ?? openMeteoQuery.data?.temperature ?? null;
  const weatherCode = openMeteoQuery.data?.weathercode ?? 0;

  let label = 'Sunny';
  let iconName: keyof typeof Ionicons.glyphMap = 'sunny-outline';

  if (ambient) {
    if (ambient.humidity != null && ambient.humidity > 80) {
      label = 'Rainy';
      iconName = 'rainy-outline';
    } else if (ambient.solarIrradiance != null && ambient.solarIrradiance < 100) {
      label = 'Cloudy';
      iconName = 'cloudy-outline';
    }
  } else if (openMeteoQuery.data) {
    if (weatherCode === 2 || weatherCode === 3) {
      label = 'Cloudy';
      iconName = 'cloudy-outline';
    } else if (weatherCode >= 51) {
      label = 'Rainy';
      iconName = 'rainy-outline';
    }
  }

  return { temp: temp != null ? `${Math.round(temp)}°` : '—', label, iconName };
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const { isLoading: profileLoading } = useProfile();
  const { data: batteries = [], isLoading: batteriesLoading } = useMyBatteryAssets();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: sites = [] } = useMySites();
  const [pickedId, setPickedId] = useState<string | null>(null);

  const primarySite = sites[0];
  const weather = useLiveWeather(primarySite?.id, primarySite?.latitude, primarySite?.longitude);

  const user = useSessionStore((state) => state.user);
  const fleetScope = useMemo(
    () => (user ? buildFleetScope(user.role, { accountId: user.accountId }) : null),
    [user],
  );
  const { liveByAsset } = useBatteryFleetStream(fleetScope);
  // pageSize trùng màn blog nên hai nơi dùng chung một cache, không gọi thêm lần nữa.
  const { data: blog } = useBlogInfiniteList({ pageSize: 10 });
  const latestPost = blog?.pages[0]?.items?.[0];

  // The whole screen reads one battery at a time — the fleet averages it used to
  // show (an average voltage across packs) never described anything physical.
  const selected = batteries.find((b) => b.id === pickedId) ?? batteries[0];
  const live = selected ? liveByAsset.get(selected.id) : undefined;

  if (profileLoading) {
    return (
      <View style={styles.center}>
        <EnergyBackdrop />
        <ActivityIndicator size="large" color={Solar.yellowDeep} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <EnergyBackdrop />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 6 }]}
      >
        <View style={styles.header}>
          <View style={styles.weatherLine}>
            <Ionicons name={weather.iconName} size={20} color={Solar.ink} />
            <Text style={styles.tempText}>{weather.temp}</Text>
            <Text style={styles.weatherDateText}>
              {weather.label} / Today, {formatDate(new Date())}
            </Text>
          </View>

          <PressableScale
            style={styles.notificationButton}
            scaleTo={0.9}
            onPress={() => router.push('/(customer)/settings/notification-list')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={Solar.ink} />
            {unreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </PressableScale>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroValue}>
              {live ? `${Math.round(live.socPercent)}%` : '—'}
            </Text>
            <Text style={styles.heroLabel}>
              {selected ? 'Charge remaining' : 'No battery linked yet'}
            </Text>
          </View>
          <Image
            source={BATTERY_IMAGE}
            style={[styles.heroBattery, !live && styles.heroBatteryMuted]}
            contentFit="contain"
            transition={220}
          />
          {/* Pack temperature belongs to the pack, so it is labelled on it. */}
          {live ? (
            <View style={styles.tempBadge}>
              <Ionicons name="thermometer-outline" size={13} color={tempTint(live.temperature)} />
              <Text style={[styles.tempValue, { color: tempTint(live.temperature) }]}>
                {live.temperature.toFixed(1)}
                <Text style={styles.tempUnit}> °C</Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* Only worth a switcher when there is something to switch between. */}
        {batteries.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipScroll}
          >
            {batteries.map((battery) => {
              const isActive = battery.id === selected?.id;
              return (
                <PressableScale
                  key={battery.id}
                  scaleTo={0.94}
                  onPress={() => setPickedId(battery.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={[styles.chip, isActive && styles.chipActive]}
                >
                  <View style={[styles.chipDot, liveByAsset.has(battery.id) && styles.chipDotLive]} />
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]} numberOfLines={1}>
                    {battery.serialNumber}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        ) : null}

        {batteriesLoading ? (
          <ActivityIndicator size="small" color={Solar.yellowDeep} style={styles.listLoader} />
        ) : selected ? (
          <>
            <EnergyFlowCard live={live} serial={selected.serialNumber} />

            <PressableScale
              style={styles.detailBtn}
              scaleTo={0.98}
              onPress={() =>
                router.push({ pathname: '/(customer)/batteries/[id]', params: { id: selected.id } })
              }
            >
              <Text style={styles.detailBtnText}>Open {selected.serialNumber}</Text>
              <Ionicons name="arrow-forward" size={16} color={Solar.ink} />
            </PressableScale>
          </>
        ) : (
          <GlassSurface style={styles.emptyCard}>
            <Ionicons name="battery-dead-outline" size={40} color={Solar.faint} />
            <Text style={styles.emptyTitle}>No battery linked</Text>
            <Text style={styles.emptySub}>
              Once a storage device is assigned to your account its live readings appear here.
            </Text>
          </GlassSurface>
        )}

        {/* Bài mới nhất hiện thẳng ra thay vì một ô "News" rỗng — cùng diện tích nhưng nói được
            nội dung, và vẫn chỉ là cache dùng chung với màn blog. */}
        <PressableScale
          style={styles.newsCard}
          scaleTo={0.98}
          onPress={() =>
            latestPost
              ? router.push({ pathname: '/(customer)/blog/[id]', params: { id: latestPost.id } })
              : router.push('/(customer)/blog' as never)
          }
        >
          <View style={styles.newsHead}>
            <View style={styles.newsIcon}>
              <Ionicons name="newspaper-outline" size={16} color={Solar.yellowDeep} />
            </View>
            <Text style={styles.sectionCaption}>News</Text>
            <Text style={styles.newsMore}>All posts</Text>
            <Ionicons name="chevron-forward" size={14} color={Solar.mute} />
          </View>

          {latestPost ? (
            <>
              <Text style={styles.newsTitle} numberOfLines={2}>
                {latestPost.title}
              </Text>
              <Text style={styles.newsSummary} numberOfLines={2}>
                {latestPost.summary}
              </Text>
              <Text style={styles.newsDate}>{formatDate(new Date(latestPost.createdAt))}</Text>
            </>
          ) : (
            <Text style={styles.newsSummary}>No posts published yet</Text>
          )}
        </PressableScale>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Solar.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Solar.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 110 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  weatherLine: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 12 },
  tempText: { fontSize: 24, fontWeight: '700', color: Solar.ink, letterSpacing: -0.5 },
  weatherDateText: { ...Font.meta, fontSize: 11, marginLeft: 2, flexShrink: 1 },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Solar.card,
    borderWidth: 1,
    borderColor: Solar.cardEdge,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Solar.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 5,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Solar.white,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: { color: Solar.white, fontSize: 8, lineHeight: 10, fontWeight: '700' },

  hero: { height: 160, justifyContent: 'center' },
  heroCopy: { flex: 1, justifyContent: 'center' },
  heroValue: { fontSize: 58, lineHeight: 60, fontWeight: '700', color: Solar.ink, letterSpacing: -1.8 },
  heroLabel: { ...Font.meta, fontSize: 13, marginTop: 4 },
  heroBattery: { width: 175, height: 150, position: 'absolute', right: -10, top: 4 },
  heroBatteryMuted: { opacity: 0.4 },
  tempBadge: {
    position: 'absolute',
    right: 34,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Solar.white,
    borderWidth: 1,
    borderColor: Solar.border,
    shadowColor: Solar.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tempValue: { fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
  tempUnit: { fontSize: 10, fontWeight: '700', color: Solar.mute },

  chipScroll: { marginBottom: 14, marginHorizontal: -20 },
  chipRow: { gap: 8, paddingHorizontal: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Solar.card,
    borderWidth: 1,
    borderColor: Solar.border,
  },
  chipActive: { backgroundColor: Solar.yellow, borderColor: Solar.yellow },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Solar.faint },
  chipDotLive: { backgroundColor: Colors.success },
  chipText: { fontSize: 12, fontWeight: '600', color: Solar.mute, maxWidth: 130 },
  chipTextActive: { color: Solar.ink, fontWeight: '700' },

  listLoader: { marginVertical: 40 },

  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radius.tile,
    backgroundColor: Solar.yellow,
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  detailBtnText: { fontSize: 14, fontWeight: '700', color: Solar.ink },

  emptyCard: { alignItems: 'center', padding: 28, marginBottom: 20 },
  emptyTitle: { ...Font.title, fontSize: 16, marginTop: 10 },
  emptySub: { ...Font.meta, textAlign: 'center', marginTop: 6, lineHeight: 17 },

  sectionCaption: { ...Font.micro, color: Solar.mute, flex: 1 },


  newsCard: {
    backgroundColor: Solar.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Solar.cardEdge,
    padding: 16,
    marginTop: 20,
    shadowColor: Solar.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  newsHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  newsIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Solar.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsMore: { ...Font.meta, fontSize: 11, color: Solar.yellowDeep, fontWeight: '700' },
  newsTitle: { ...Font.body, fontSize: 15, lineHeight: 20 },
  newsSummary: { ...Font.meta, fontSize: 12, lineHeight: 17, marginTop: 4 },
  newsDate: { ...Font.meta, fontSize: 10, color: Solar.faint, marginTop: 8 },
});
