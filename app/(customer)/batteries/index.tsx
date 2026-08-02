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
import { Solar } from '@/src/lib/theme';
import { EnergyBackdrop, GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';

const BATTERY_IMAGE = require('../../../assets/images/battery-storage-3d.png');

export default function BatteriesListScreen() {
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

  return (
    <View style={styles.root}>
      <EnergyBackdrop />

      {/* Header Row */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Solar.ink} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Tất cả cục pin</Text>
          <Text style={styles.subtitle}>{batteries.length} thiết bị lưu trữ</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Solar.mute} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo mã Serial hoặc loại pin..."
          placeholderTextColor={Solar.faint}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Solar.mute} />
          </Pressable>
        ) : null}
      </View>

      {/* Content Body */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Solar.yellowDeep} />
        </View>
      ) : filteredBatteries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <GlassSurface style={styles.emptyCard}>
            <Ionicons name="battery-dead-outline" size={50} color={Solar.faint} />
            <Text style={styles.emptyTitle}>Không tìm thấy cục pin nào</Text>
            <Text style={styles.emptySub}>Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại danh sách.</Text>
          </GlassSurface>
        </View>
      ) : (
        <FlatList
          data={filteredBatteries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => {
            const live = liveByAsset.get(item.id);
            return (
              <Pressable
                style={{ flex: 1 }}
                onPress={() =>
                  router.push({ pathname: '/(customer)/batteries/[id]', params: { id: item.id } })
                }
              >
                {({ pressed }) => (
                  <GlassSurface style={[styles.card, pressed && styles.pressed]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.serialText} numberOfLines={1}>
                        {item.serialNumber}
                      </Text>
                      <View style={styles.iconBoxStack}>
                        <Ionicons name="layers" size={14} color={Solar.ink} />
                      </View>
                    </View>

                    <View style={styles.socPillGrey}>
                      <View style={styles.socIconCircle}>
                        <Ionicons name="flash" size={11} color={Solar.yellow} />
                      </View>
                      <Text style={styles.socText}>
                        {live ? `${Math.round(live.socPercent)}%` : '—'}
                      </Text>
                    </View>

                    <Image source={BATTERY_IMAGE} style={styles.batteryThumb} contentFit="contain" />

                    <View style={styles.cardFooter}>
                      <Text style={styles.voltageText}>
                        {live ? `${live.voltage.toFixed(1)} V` : '—'}
                      </Text>
                      <Text style={styles.typeNameText} numberOfLines={1}>
                        {item.batteryTypeName || 'Thiết bị lưu trữ'}
                      </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8C7A4B',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  titleWrap: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', color: Solar.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 11, color: Solar.mute, fontWeight: '600', marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 215, 0.7)',
    shadowColor: '#8C7A4B',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: Solar.ink, fontWeight: '600' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  columnWrapper: { gap: 14, marginBottom: 14 },
  card: {
    height: 215,
    borderRadius: 24,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serialText: { fontSize: 13, fontWeight: '900', color: Solar.ink, flex: 1, marginRight: 4 },
  iconBoxStack: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socPillGrey: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAEAEA',
    borderRadius: 999,
    paddingLeft: 3,
    paddingRight: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  socIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socText: { fontSize: 11, fontWeight: '900', color: Solar.ink },
  batteryThumb: { width: '100%', height: 80, marginVertical: 4 },
  cardFooter: { marginTop: 2 },
  voltageText: { fontSize: 18, lineHeight: 21, fontWeight: '900', color: Solar.ink },
  typeNameText: { fontSize: 10, color: Solar.mute, fontWeight: '600', marginTop: 2 },
  emptyWrap: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
  emptyCard: { borderRadius: 24, alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: Solar.ink, marginTop: 12 },
  emptySub: { fontSize: 12, color: Solar.mute, textAlign: 'center', marginTop: 6 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
