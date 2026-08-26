import React, { useMemo, useRef, useState } from 'react';
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
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { useScrollToTop } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/src/features/profile/hooks/useProfile';
import { useMyBatteryAssets } from '@/src/features/batteries/hooks/useMyBatteryAssets';
import { useUnreadCount } from '@/src/features/notifications/hooks/useNotifications';
import { useBatteryFleetStream } from '@/src/features/batteries/hooks/useBatteryFleetStream';
import { useSensorReadingAggregate } from '@/src/features/batteries/hooks/useSensorReadingAggregate';
import { buildFleetScope } from '@/src/features/batteries/utils/buildFleetScope';
import { useMySites } from '@/src/features/sites/hooks/useMySites';
import { useAmbientLatest } from '@/src/features/ambient/hooks/useAmbientLatest';
import { LiveReadingDto } from '@/src/features/batteries/types/live-reading.types';
import { SensorReadingAggregateDto } from '@/src/features/batteries/types/sensor-reading.types';
import { useSessionStore } from '@/src/stores/sessionStore';
import { formatDate } from '@/src/lib/date';
import { Colors, Font, Radius, Solar } from '@/src/lib/theme';
import { EnergyBackdrop, GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';
import { PressableScale } from '@/src/shared/components/motion';

const BATTERY_IMAGE = require('../../../assets/images/battery-storage-3d.png');

const avg = (values: number[]): number | null =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

function formatHourMinute(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}.${minutes}`;
}

type MetricKey = 'volt' | 'curr' | 'temp';

const METRICS: Record<MetricKey, {
  label: string;
  unit: string;
  pick: (bucket: SensorReadingAggregateDto) => number;
  format: (value: number) => string;
}> = {
  volt: { label: 'Voltage',     unit: 'V',  pick: (b) => b.avgVoltage,     format: (v) => `${v.toFixed(1)} V` },
  curr: { label: 'Current',     unit: 'A',  pick: (b) => b.avgCurrent,     format: (v) => `${v.toFixed(1)} A` },
  temp: { label: 'Temperature', unit: '°C', pick: (b) => b.avgTemperature, format: (v) => `${Math.round(v)} °C` },
};

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
  const [chartWidth, setChartWidth] = useState(0);
  const [metric, setMetric] = useState<MetricKey>('volt');

  const primarySite = sites[0];
  const weather = useLiveWeather(primarySite?.id, primarySite?.latitude, primarySite?.longitude);

  const user = useSessionStore((state) => state.user);
  const fleetScope = useMemo(
    () => (user ? buildFleetScope(user.role, { accountId: user.accountId }) : null),
    [user],
  );
  const { liveByAsset } = useBatteryFleetStream(fleetScope);
  const liveReadings = batteries
    .map((battery) => liveByAsset.get(battery.id))
    .filter((reading): reading is LiveReadingDto => !!reading);

  const avgSoc = avg(liveReadings.map((reading) => reading.socPercent));
  const avgVolt = avg(liveReadings.map((reading) => reading.voltage));
  const avgCurr = avg(liveReadings.map((reading) => reading.current));
  const avgTemp = avg(liveReadings.map((reading) => reading.temperature));

  // Real 24h trend for the primary battery. The chart used to synthesise seven
  // points by multiplying one live reading by a hardcoded array — a drawn curve
  // that never corresponded to anything measured.
  const primaryBattery = batteries[0];
  const { data: buckets = [], isLoading: trendLoading } = useSensorReadingAggregate(
    primaryBattery?.id ?? '',
    { hours: 24, interval: '1h' },
  );

  const active = METRICS[metric];

  const chartPoints = useMemo(() => {
    const focusIndex = buckets.length - 1;
    return buckets.map((bucket, index) => {
      const isFocused = index === focusIndex;
      return {
        value: active.pick(bucket),
        // Only every 4th bucket gets a label, otherwise 24 of them collide.
        label: index % 4 === 0 || isFocused ? formatHourMinute(bucket.time) : '',
        hideDataPoint: !isFocused,
        customDataPoint: isFocused
          ? () => (
            <View style={styles.focalContainer}>
              <View style={styles.focalDotOuter}>
                <View style={styles.focalDotInner} />
              </View>
              <LinearGradient
                colors={['#FFD500', 'rgba(255, 213, 0, 0.02)']}
                style={styles.needleLine}
              />
            </View>
          )
          : undefined,
      };
    });
  }, [buckets, active]);


  if (profileLoading) {
    return (
      <View style={styles.center}>
        <EnergyBackdrop />
        <ActivityIndicator size="large" color={Solar.yellowDeep} />
      </View>
    );
  }

  const todayString = formatDate(new Date());

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
            <Text style={styles.weatherDateText}>{weather.label} / Today, {todayString}</Text>
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
            <Text style={styles.heroValue}>{avgSoc != null ? `${Math.round(avgSoc)}%` : '—'}</Text>
            <Text style={styles.heroLabel}>Average battery charge</Text>
          </View>
          <Image source={BATTERY_IMAGE} style={styles.heroBattery} contentFit="contain" transition={220} />
        </View>

        <GlassSurface style={styles.waveCard} warm>
          <View style={styles.waveTop}>
            <View style={styles.waveTopCopy}>
              <Text style={styles.waveCaption}>Last 24 hours</Text>
              <Text style={styles.waveCount} numberOfLines={1}>
                {primaryBattery?.serialNumber ?? 'No battery linked'}
              </Text>
            </View>
          </View>

          <View onLayout={(event: LayoutChangeEvent) => setChartWidth(event.nativeEvent.layout.width)}>
            {chartPoints.length >= 2 && chartWidth > 0 ? (
              <View style={styles.chartWrapper}>
                <LineChart
                  data={chartPoints}
                  height={95}
                  width={chartWidth - 10}
                  adjustToWidth
                  initialSpacing={14}
                  endSpacing={14}
                  curved
                  thickness={2.5}
                  color={Solar.yellow}
                  areaChart
                  startFillColor={Solar.yellow}
                  endFillColor="#FFFFFF"
                  startOpacity={0.22}
                  endOpacity={0.0}
                  hideRules
                  hideYAxisText
                  xAxisColor="transparent"
                  yAxisColor="transparent"
                  yAxisLabelWidth={0}
                  xAxisLabelsHeight={24}
                  xAxisLabelTextStyle={styles.axisLabel}
                  disableScroll
                />
                <View style={styles.dashedBaselineContainer} pointerEvents="none">
                  <Svg height={2} width="100%">
                    <Line
                      x1="0"
                      y1="1"
                      x2="100%"
                      y2="1"
                      stroke="rgba(215, 210, 195, 0.85)"
                      strokeDasharray="5 5"
                      strokeWidth="1.2"
                    />
                  </Svg>
                </View>
              </View>
            ) : (
              <View style={styles.waveEmpty}>
                <Text style={styles.waveEmptyText}>
                  {batteriesLoading || trendLoading
                    ? 'Loading readings…'
                    : !primaryBattery
                      ? 'No battery linked to your account yet'
                      : 'No readings in the last 24 hours'}
                </Text>
              </View>
            )}
          </View>

          {/* Tapping a cell switches which metric the trend above plots.
              Values are the live fleet average — `—` when nothing is reporting. */}
          <View style={styles.statStrip}>
            {(Object.keys(METRICS) as MetricKey[]).map((key) => {
              const cell = METRICS[key];
              const value = key === 'volt' ? avgVolt : key === 'curr' ? avgCurr : avgTemp;
              const isActive = metric === key;
              return (
                <PressableScale
                  key={key}
                  style={[styles.statCell, isActive && styles.statCellActive]}
                  scaleTo={0.95}
                  onPress={() => setMetric(key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.statLabel, isActive && styles.statLabelActive]}>{cell.label}</Text>
                  <Text style={styles.statValue}>{value != null ? cell.format(value) : '—'}</Text>
                </PressableScale>
              );
            })}
          </View>
        </GlassSurface>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My batteries</Text>
          <Pressable onPress={() => router.push('/(customer)/batteries' as any)}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>

        {batteriesLoading ? (
          <ActivityIndicator size="small" color={Solar.yellowDeep} style={styles.listLoader} />
        ) : (
          <FlatList
            data={batteries}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.batteryRow}
            style={styles.batteryList}
            renderItem={({ item }) => {
              const live = liveByAsset.get(item.id);
              return (
                <PressableScale
                  scaleTo={0.96}
                  onPress={() =>
                    router.push({ pathname: '/(customer)/batteries/[id]', params: { id: item.id } })
                  }
                >
                  <GlassSurface style={styles.batteryCard}>
                    <View style={styles.batteryCardTop}>
                      <Text style={styles.batteryName} numberOfLines={1}>{item.serialNumber}</Text>
                      <View style={styles.iconBoxStack}>
                        <Ionicons name="layers" size={15} color={Solar.ink} />
                      </View>
                    </View>

                    <View style={styles.socPill}>
                      <View style={styles.socIconCircle}>
                        <Ionicons name="flash" size={12} color={Solar.yellowDeep} />
                      </View>
                      <Text style={styles.socText}>{live ? `${Math.round(live.socPercent)}%` : '—'}</Text>
                    </View>

                    <Image
                      source={BATTERY_IMAGE}
                      style={[styles.batteryThumb, !live && styles.batteryThumbMuted]}
                      contentFit="contain"
                    />

                    <View>
                      <Text style={styles.batteryValue}>
                        {live ? `${live.voltage.toFixed(1)} V` : '—'}
                      </Text>
                      <Text style={styles.batteryCaption} numberOfLines={1}>
                        {item.batteryTypeName || 'Current voltage'}
                      </Text>
                    </View>
                  </GlassSurface>
                </PressableScale>
              );
            }}
          />
        )}

        <PressableScale
          style={styles.blogEntry}
          scaleTo={0.98}
          onPress={() => router.push('/(customer)/blog' as never)}
        >
          <View style={styles.blogIcon}>
            <Ionicons name="newspaper-outline" size={20} color={Solar.yellowDeep} />
          </View>
          <View style={styles.blogBody}>
            <Text style={styles.blogTitle}>News</Text>
            <Text style={styles.blogDesc}>Latest posts from the system</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Solar.mute} />
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

  hero: { height: 170, justifyContent: 'center', marginBottom: 4 },
  heroCopy: { flex: 1, justifyContent: 'center' },
  heroValue: { fontSize: 58, lineHeight: 60, fontWeight: '700', color: Solar.ink, letterSpacing: -1.8 },
  heroLabel: { ...Font.meta, fontSize: 13, marginTop: 4 },
  heroBattery: { width: 180, height: 160, position: 'absolute', right: -10, top: 4 },

  waveCard: { padding: 16, marginBottom: 16 },
  waveTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  waveTopCopy: { flex: 1 },
  waveCaption: { ...Font.meta },
  waveCount: { ...Font.title, marginTop: 1 },
  axisLabel: { fontSize: 10, color: Solar.mute, fontWeight: '600', marginTop: 8 },
  chartWrapper: { position: 'relative', height: 125, justifyContent: 'flex-end', marginBottom: 6 },
  dashedBaselineContainer: { position: 'absolute', bottom: 24, left: 0, right: 0 },
  focalContainer: { alignItems: 'center', justifyContent: 'flex-start', width: 20, height: 60 },
  focalDotOuter: {
    width: 14,
    height: 14,
    backgroundColor: Solar.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  focalDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: Solar.ink },
  needleLine: { width: 2.5, height: 38, marginTop: -1, borderRadius: 1.25 },
  waveEmpty: { height: 95, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  waveEmptyText: { ...Font.meta, textAlign: 'center' },

  statStrip: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statCell: {
    flex: 1,
    height: 64,
    borderRadius: Radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Solar.card,
    borderWidth: 1,
    borderColor: Solar.cardEdge,
  },
  statCellActive: {
    backgroundColor: Solar.yellow,
    borderColor: Solar.yellow,
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  statLabel: { ...Font.meta, fontSize: 11, textAlign: 'center' },
  statLabelActive: { color: Solar.ink, fontWeight: '700' },
  statValue: { fontSize: 15, color: Solar.ink, fontWeight: '700', marginTop: 3, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { ...Font.title },
  sectionLink: { ...Font.meta, color: Solar.yellowDeep, fontWeight: '700' },
  listLoader: { marginVertical: 25 },
  batteryList: { marginBottom: 24 },
  batteryRow: { gap: 12, paddingRight: 20, paddingBottom: 4 },
  batteryCard: {
    width: 185,
    height: 215,
    padding: 14,
    justifyContent: 'space-between',
  },
  batteryCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  batteryName: { ...Font.body, fontSize: 14, flex: 1, marginRight: 4 },
  iconBoxStack: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Solar.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Solar.tile,
    borderRadius: 999,
    paddingLeft: 3,
    paddingRight: 9,
    paddingVertical: 3,
    marginTop: 6,
  },
  socIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Solar.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socText: { fontSize: 12, fontWeight: '700', color: Solar.ink },
  batteryThumb: { width: '100%', height: 82, marginVertical: 4 },
  batteryThumbMuted: { opacity: 0.38 },
  batteryValue: { fontSize: 18, lineHeight: 21, color: Solar.ink, fontWeight: '700' },
  batteryCaption: { ...Font.meta, fontSize: 10, marginTop: 2 },

  blogEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Solar.card,
    borderRadius: Radius.card,
    padding: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  blogIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.tile,
    backgroundColor: Solar.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blogBody: { flex: 1 },
  blogTitle: { ...Font.body },
  blogDesc: { ...Font.meta, marginTop: 2 },

});
