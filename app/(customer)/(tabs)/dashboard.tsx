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
import { useMyAlerts } from '@/src/features/batteries/hooks/useMyAlerts';
import { useBatteryFleetStream } from '@/src/features/batteries/hooks/useBatteryFleetStream';
import { buildFleetScope } from '@/src/features/batteries/utils/buildFleetScope';
import { useMySites } from '@/src/features/sites/hooks/useMySites';
import { useAmbientLatest } from '@/src/features/ambient/hooks/useAmbientLatest';
import { AlertStatusEnum } from '@/src/shared/enums/alert.enum';
import { LiveReadingDto } from '@/src/features/batteries/types/live-reading.types';
import { useSessionStore } from '@/src/stores/sessionStore';
import { formatDate } from '@/src/lib/date';
import { Colors, Solar } from '@/src/lib/theme';
import { EnergyBackdrop, GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';

const BATTERY_IMAGE = require('../../../assets/images/battery-storage-3d.png');

const avg = (values: number[]): number | null =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

function formatHourMinute(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}.${minutes}`;
}

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

  const temp = ambient?.ambientTemperature ?? openMeteoQuery.data?.temperature ?? 26;
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
    } else {
      label = 'Sunny';
      iconName = 'sunny-outline';
    }
  } else if (openMeteoQuery.data) {
    if (weatherCode === 0 || weatherCode === 1) {
      label = 'Sunny';
      iconName = 'sunny-outline';
    } else if (weatherCode === 2 || weatherCode === 3) {
      label = 'Cloudy';
      iconName = 'cloudy-outline';
    } else if (weatherCode >= 51) {
      label = 'Rainy';
      iconName = 'rainy-outline';
    }
  }

  return {
    temp: `${Math.round(temp)}°`,
    label,
    iconName,
  };
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const { isLoading: profileLoading } = useProfile();
  const { data: batteries = [], isLoading: batteriesLoading } = useMyBatteryAssets();
  const { data: alerts = [] } = useMyAlerts();
  const { data: sites = [] } = useMySites();
  const [waveWidth, setWaveWidth] = useState(0);
  const [activeTab, setActiveTab] = useState<'volt' | 'curr' | 'temp'>('volt');

  const primarySite = sites[0];
  const weather = useLiveWeather(primarySite?.id, primarySite?.latitude, primarySite?.longitude);

  const user = useSessionStore((state) => state.user);
  const fleetScope = useMemo(
    () => (user ? buildFleetScope(user.role, { accountId: user.accountId }) : null),
    [user],
  );
  const { liveByAsset } = useBatteryFleetStream(fleetScope);

  const openAlertsCount = alerts.filter((alert) => alert.status === AlertStatusEnum.Open).length;
  const liveReadings = batteries
    .map((battery) => liveByAsset.get(battery.id))
    .filter((reading): reading is LiveReadingDto => !!reading);

  const avgSoc = avg(liveReadings.map((reading) => reading.socPercent));
  const avgVolt = avg(liveReadings.map((reading) => reading.voltage));
  const avgCurr = avg(liveReadings.map((reading) => reading.current));
  const avgTemp = avg(liveReadings.map((reading) => reading.temperature));

  const wavePoints = useMemo(() => {
    const readings = batteries
      .map((battery) => liveByAsset.get(battery.id))
      .filter((reading): reading is LiveReadingDto => !!reading);

    const now = new Date();
    const pointCount = 7;
    const intervalMinutes = 30;
    const baseMultipliers = [0.45, 0.42, 0.38, 0.95, 0.52, 0.58, 0.5];

    return Array.from({ length: pointCount }).map((_, idx) => {
      const pointTime = new Date(now.getTime() - (pointCount - 1 - idx) * intervalMinutes * 60 * 1000);
      const label = formatHourMinute(pointTime);

      let baseVal = 20;
      if (readings.length > 0) {
        const reading = readings[idx % readings.length];
        if (activeTab === 'volt') baseVal = reading.voltage;
        else if (activeTab === 'curr') baseVal = Math.abs(reading.current) || 5.5;
        else baseVal = reading.temperature;
      } else {
        if (activeTab === 'volt') baseVal = 20.0;
        else if (activeTab === 'curr') baseVal = 5.5;
        else baseVal = 34.0;
      }

      const value = baseVal * (0.6 + baseMultipliers[idx] * 0.4);
      const isFocused = idx === 5;

      return {
        value,
        label,
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
  }, [batteries, liveByAsset, activeTab]);

  const maxChartValue = useMemo(() => {
    if (activeTab === 'volt') return 60;
    if (activeTab === 'curr') return 20;
    return 60;
  }, [activeTab]);

  if (profileLoading) {
    return (
      <View style={styles.center}>
        <EnergyBackdrop />
        <ActivityIndicator size="large" color={Solar.yellowDeep} />
      </View>
    );
  }

  const countLabel = batteries.length > 0 ? String(batteries.length).padStart(2, '0') : '0';
  const todayString = formatDate(new Date());

  return (
    <View style={styles.root}>
      <EnergyBackdrop />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 6 }]}
      >
        {/* Top Header Row */}
        <View style={styles.header}>
          <View style={styles.greetingWrap}>
            <View style={styles.weatherLine}>
              <Ionicons name={weather.iconName} size={20} color={Solar.ink} />
              <Text style={styles.tempText}>{weather.temp}</Text>
              <Text style={styles.weatherDateText}>{weather.label} / Today, {todayString}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
            onPress={() => router.push('/(customer)/settings/notification-list')}
            hitSlop={10}
          >
            <Ionicons name="notifications-outline" size={20} color={Solar.ink} />
            {openAlertsCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>
                  {openAlertsCount > 9 ? '9+' : openAlertsCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroValue}>{avgSoc != null ? `${Math.round(avgSoc)}%` : '—'}</Text>
            <Text style={styles.heroLabel}>Average battery charge</Text>
          </View>

          <Image source={BATTERY_IMAGE} style={styles.heroBattery} contentFit="contain" transition={220} />
        </View>

        {/* Main Chart Glass Card — warm, softly blurred Liquid Glass style */}
        <GlassSurface style={styles.waveCard} warm>
          <View style={styles.waveTop}>
            <View>
              <Text style={styles.waveCaption}>Battery count</Text>
              <Text style={styles.waveCount}>{countLabel} Batteries</Text>
            </View>
          </View>

          <View onLayout={(event: LayoutChangeEvent) => setWaveWidth(event.nativeEvent.layout.width)}>
            {wavePoints.length >= 2 && waveWidth > 0 ? (
              <View style={styles.chartWrapper}>
                <LineChart
                  data={wavePoints}
                  height={95}
                  width={waveWidth - 10}
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
                  xAxisLabelTextStyle={{ fontSize: 10, color: Solar.mute, fontWeight: '700', marginTop: 8 }}
                  disableScroll
                  maxValue={maxChartValue}
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
                  {batteriesLoading ? 'Loading data…' : 'No realtime data yet'}
                </Text>
              </View>
            )}
          </View>

          {/* 3 stat cells: Voltage, Current, Temperature */}
          <View style={styles.statStrip}>
            <Pressable
              style={[styles.statCell, activeTab === 'volt' && styles.statCellActive]}
              onPress={() => setActiveTab('volt')}
            >
              <Text style={[styles.statLabel, activeTab === 'volt' && styles.statLabelActive]}>Voltage</Text>
              <Text style={[styles.statValue, activeTab === 'volt' && styles.statValueActive]}>
                {avgVolt != null ? `${avgVolt.toFixed(1)} V` : '20.0 V'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.statCell, activeTab === 'curr' && styles.statCellActive]}
              onPress={() => setActiveTab('curr')}
            >
              <Text style={[styles.statLabel, activeTab === 'curr' && styles.statLabelActive]}>Current</Text>
              <Text style={[styles.statValue, activeTab === 'curr' && styles.statValueActive]}>
                {avgCurr != null ? `${avgCurr.toFixed(1)} A` : '5.5 A'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.statCell, activeTab === 'temp' && styles.statCellActive]}
              onPress={() => setActiveTab('temp')}
            >
              <Text style={[styles.statLabel, activeTab === 'temp' && styles.statLabelActive]}>Temperature</Text>
              <Text style={[styles.statValue, activeTab === 'temp' && styles.statValueActive]}>
                {avgTemp != null ? `${Math.round(avgTemp)} °C` : '34 °C'}
              </Text>
            </Pressable>
          </View>
        </GlassSurface>

        {/* Section Header: "My batteries" */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My batteries</Text>
          <Pressable onPress={() => router.push('/(customer)/batteries' as any)}>
            <Text style={styles.sectionCount}>View all</Text>
          </Pressable>
        </View>

        {/* Cards Row */}
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
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/(customer)/batteries/[id]', params: { id: item.id } })
                  }
                >
                  {({ pressed }) => (
                    <GlassSurface style={[styles.batteryCard, pressed && styles.pressed]}>
                      <View style={styles.batteryCardTop}>
                        <Text style={styles.batteryName} numberOfLines={1}>{item.serialNumber}</Text>
                        <View style={styles.iconBoxStack}>
                          <Ionicons name="layers" size={15} color={Solar.ink} />
                        </View>
                      </View>

                      <View style={styles.socPillGrey}>
                        <View style={styles.socIconCircle}>
                          <Ionicons name="flash" size={12} color={Solar.yellow} />
                        </View>
                        <Text style={styles.socText}>{live ? `${Math.round(live.socPercent)}%` : '—'}</Text>
                      </View>

                      <Image
                        source={BATTERY_IMAGE}
                        style={[styles.batteryThumb, !live && styles.batteryThumbMuted]}
                        contentFit="contain"
                      />

                      <View style={styles.batteryCardBottom}>
                        <Text style={styles.batteryValue}>
                          {live ? `${live.voltage.toFixed(1)} V` : '—'}
                        </Text>
                        <Text style={styles.batteryCaption} numberOfLines={1}>
                          {item.batteryTypeName || 'Current voltage'}
                        </Text>
                      </View>
                    </GlassSurface>
                  )}
                </Pressable>
              );
            }}
          />
        )}

        {/* GH-78 — Blog entry point for Customer. */}
        <Pressable
          style={styles.blogEntry}
          onPress={() => router.push('/(customer)/blog' as never)}
        >
          <View style={styles.blogIcon}>
            <Ionicons name="newspaper-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.blogBody}>
            <Text style={styles.blogTitle}>News</Text>
            <Text style={styles.blogDesc}>Latest posts from the system</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Solar.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Solar.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  greetingWrap: { flex: 1, marginRight: 12 },
  weatherLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tempText: { fontSize: 24, fontWeight: '900', color: Solar.ink, letterSpacing: -0.5 },
  weatherDateText: { fontSize: 11, color: Solar.mute, fontWeight: '700', marginLeft: 2 },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8C7A4B',
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
    borderColor: '#FFFFFF',
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: { color: '#FFFFFF', fontSize: 8, lineHeight: 10, fontWeight: '900' },
  hero: { height: 170, justifyContent: 'center', marginBottom: 4 },
  heroCopy: { flex: 1, justifyContent: 'center' },
  heroValue: { fontSize: 58, lineHeight: 60, fontWeight: '900', color: Solar.ink, letterSpacing: -1.8 },
  heroLabel: { fontSize: 13, color: Solar.mute, fontWeight: '700', marginTop: 4 },
  heroBattery: { width: 180, height: 160, position: 'absolute', right: -10, top: 4 },

  waveCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  waveTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  waveCaption: { fontSize: 12, color: Solar.mute, fontWeight: '700' },
  waveCount: { fontSize: 18, fontWeight: '900', color: Solar.ink, letterSpacing: -0.4 },
  chartWrapper: { position: 'relative', height: 125, justifyContent: 'flex-end', marginBottom: 6 },
  dashedBaselineContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
  },
  focalContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 20,
    height: 60,
  },
  focalDotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Solar.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D9A000',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  focalDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1C1C1E',
  },
  needleLine: {
    width: 2.5,
    height: 38,
    marginTop: -1,
    borderRadius: 1.25,
  },
  waveEmpty: { height: 95, justifyContent: 'center', alignItems: 'center' },
  waveEmptyText: { fontSize: 12, color: Solar.mute, fontWeight: '600' },

  // GH-78 — Blog entry row.
  blogEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  blogIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blogBody: { flex: 1 },
  blogTitle: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  blogDesc: { fontSize: 12, color: Colors.gray, marginTop: 2 },
  statStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  statCell: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.96)',
    shadowColor: '#8C7A4B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  statCellActive: {
    backgroundColor: Solar.yellow,
    borderWidth: 0,
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  statLabel: { fontSize: 11, color: Solar.mute, fontWeight: '600', textAlign: 'center' },
  statLabelActive: { color: Solar.ink, fontWeight: '700', textAlign: 'center' },
  statValue: { fontSize: 15, color: Solar.ink, fontWeight: '900', marginTop: 3, textAlign: 'center' },
  statValueActive: { color: Solar.ink, fontWeight: '900', textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Solar.ink, letterSpacing: -0.4 },
  sectionCount: { fontSize: 12, color: Solar.mute, fontWeight: '700' },
  listLoader: { marginVertical: 25 },
  batteryList: { marginBottom: 24 },
  batteryRow: { gap: 12, paddingRight: 20, paddingBottom: 4 },
  batteryCard: {
    width: 185,
    height: 215,
    borderRadius: 24,
    padding: 14,
    justifyContent: 'space-between',
  },
  batteryCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  batteryName: { fontSize: 13.5, fontWeight: '900', color: Solar.ink, flex: 1, marginRight: 4 },
  iconBoxStack: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socPillGrey: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAEAEA',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socText: { fontSize: 12, fontWeight: '900', color: Solar.ink },
  batteryThumb: { width: '100%', height: 82, marginVertical: 4 },
  batteryThumbMuted: { opacity: 0.38 },
  batteryCardBottom: { marginTop: 2 },
  batteryValue: { fontSize: 18, lineHeight: 21, color: Solar.ink, fontWeight: '900' },
  batteryCaption: { fontSize: 10, color: Solar.mute, fontWeight: '600', marginTop: 2 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
