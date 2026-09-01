import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyBatteryAssets } from '@/src/features/batteries/hooks/useMyBatteryAssets';
import { useBatteryFleetStream } from '@/src/features/batteries/hooks/useBatteryFleetStream';
import { buildFleetScope } from '@/src/features/batteries/utils/buildFleetScope';
import { useSessionStore } from '@/src/stores/sessionStore';
import { Colors, Font, Solar } from '@/src/lib/theme';
import { EnergyBackdrop, GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';
import { flowOf, FLOW_META } from '@/src/features/batteries/components/EnergyFlowCard';

const BATTERY_IMAGE = require('../../../assets/images/battery-storage-3d.png');

export default function BatteriesTabScreen() {
  const insets = useSafeAreaInsets();
  const { data: batteries = [], isLoading } = useMyBatteryAssets();
  const [searchQuery, setSearchQuery] = useState('');

  const user = useSessionStore((state) => state.user);
  const fleetScope = useMemo(
    () => (user ? buildFleetScope(user.role, { accountId: user.accountId }) : null),
    [user],
  );
  const { liveByAsset } = useBatteryFleetStream(fleetScope);

  const filteredBatteries = useMemo(() => {
    if (!searchQuery.trim()) return batteries;
    const query = searchQuery.toLowerCase();
    return batteries.filter(
      (b) =>
        b.serialNumber.toLowerCase().includes(query) ||
        (b.batteryTypeName && b.batteryTypeName.toLowerCase().includes(query)),
    );
  }, [batteries, searchQuery]);

  const liveCount = batteries.filter((b) => liveByAsset.has(b.id)).length;

  return (
    <View style={styles.root}>
      <EnergyBackdrop />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Batteries</Text>
        <Text style={styles.subtitle}>
          {batteries.length} storage device{batteries.length === 1 ? '' : 's'} · {liveCount} reporting
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Solar.mute} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by serial number or type…"
          placeholderTextColor={Solar.faint}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Solar.mute} />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Solar.yellowDeep} />
        </View>
      ) : filteredBatteries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <GlassSurface style={styles.emptyCard}>
            <Ionicons name="battery-dead-outline" size={50} color={Solar.faint} />
            <Text style={styles.emptyTitle}>No batteries found</Text>
            <Text style={styles.emptySub}>
              {batteries.length === 0
                ? 'No storage device is linked to your account yet.'
                : 'Try a different search term.'}
            </Text>
          </GlassSurface>
        </View>
      ) : (
        <FlatList
          data={filteredBatteries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const live = liveByAsset.get(item.id);
            const meta = FLOW_META[flowOf(live)];
            return (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/(customer)/batteries/[id]', params: { id: item.id } })
                }
              >
                {({ pressed }) => (
                  <GlassSurface style={[styles.row, pressed && styles.pressed]}>
                    <Image
                      source={BATTERY_IMAGE}
                      style={[styles.thumb, !live && styles.thumbMuted]}
                      contentFit="contain"
                    />

                    <View style={styles.rowBody}>
                      <Text style={styles.serial} numberOfLines={1}>
                        {item.serialNumber}
                      </Text>
                      <Text style={styles.typeName} numberOfLines={1}>
                        {item.batteryTypeName || 'Storage device'}
                      </Text>

                      <View style={styles.metrics}>
                        <Text style={styles.metric}>
                          {live ? `${live.voltage.toFixed(2)} V` : '— V'}
                        </Text>
                        <View style={styles.dot} />
                        <Text style={styles.metric}>
                          {live ? `${live.temperature.toFixed(1)} °C` : '— °C'}
                        </Text>
                        <View style={[styles.statePill, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.stateText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.socWrap}>
                      <Text style={styles.soc}>
                        {live ? `${Math.round(live.socPercent)}%` : '—'}
                      </Text>
                      {/* Charge bar, not a second number: the fill IS the reading. */}
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${live ? Math.max(3, Math.min(100, live.socPercent)) : 0}%`,
                              backgroundColor:
                                live && live.socPercent < 20 ? Colors.danger : Solar.yellow,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </GlassSurface>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Solar.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  title: { ...Font.display },
  subtitle: { ...Font.meta, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Solar.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: Solar.border,
    shadowColor: Solar.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: Solar.ink, fontWeight: '600' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 110, gap: 12 },

  row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  pressed: { opacity: 0.78 },
  thumb: { width: 54, height: 62 },
  thumbMuted: { opacity: 0.35 },
  rowBody: { flex: 1 },
  serial: { ...Font.body, fontSize: 14 },
  typeName: { ...Font.meta, fontSize: 11, marginTop: 1 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  metric: { fontSize: 11, fontWeight: '700', color: Solar.ink2 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Solar.faint },
  statePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, marginLeft: 2 },
  stateText: { fontSize: 9, fontWeight: '700' },

  socWrap: { width: 62, alignItems: 'flex-end' },
  soc: { fontSize: 19, lineHeight: 22, fontWeight: '700', color: Solar.ink, letterSpacing: -0.5 },
  barTrack: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: Solar.tile,
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },

  emptyWrap: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
  emptyCard: { alignItems: 'center', padding: 30 },
  emptyTitle: { ...Font.title, fontSize: 16, marginTop: 12 },
  emptySub: { ...Font.meta, textAlign: 'center', marginTop: 6 },
});
