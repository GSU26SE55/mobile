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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/src/lib/theme';
import { BackButton } from '@/src/shared/components/ScreenHeader';
import { useDebouncedValue } from '@/src/shared/hooks/useDebouncedValue';
import { useIotDevices } from '@/src/features/iot-devices/hooks/useIotDevices';
import { DeviceStatusCard } from '@/src/features/iot-devices/components/DeviceStatusCard';
import {
  IOT_DEVICE_STATUS_LABEL,
  IotDeviceStatusEnum,
} from '@/src/features/iot-devices/enums/iot-device.enum';

/**
 * IOT3-62 — danh sách thiết bị IoT cho Staff.
 *
 * Trước sprint này, Staff cầm thiết bị ngoài hiện trường chỉ tra được TỪNG cái một qua
 * `deviceCode` in trên thân máy (màn hình calibration). Không có cách nào xem cả trạm, nên câu
 * hỏi thường gặp nhất — "cái nào đang mất kết nối?" — không trả lời được từ điện thoại.
 */

const STATUS_FILTERS: { value: IotDeviceStatusEnum | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: IotDeviceStatusEnum.Active, label: IOT_DEVICE_STATUS_LABEL[IotDeviceStatusEnum.Active] },
  { value: IotDeviceStatusEnum.Offline, label: IOT_DEVICE_STATUS_LABEL[IotDeviceStatusEnum.Offline] },
  { value: IotDeviceStatusEnum.Pending, label: IOT_DEVICE_STATUS_LABEL[IotDeviceStatusEnum.Pending] },
];

export default function DevicesListScreen() {
  const insets = useSafeAreaInsets();
  const [keywordInput, setKeywordInput] = useState('');
  const [status, setStatus] = useState<IotDeviceStatusEnum | undefined>(undefined);

  // Gõ tới đâu gọi API tới đó sẽ bắn một request mỗi ký tự — trên 3G ở hiện trường là treo máy.
  const keyword = useDebouncedValue(keywordInput, 400);

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      status,
      pageSize: 50,
      sortBy: 'lastSeenAt',
      sortDir: 'desc' as const,
    }),
    [keyword, status],
  );

  const query = useIotDevices(params);
  const items = query.data?.items ?? [];

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <Text style={styles.topTitle}>IoT Devices</Text>
        {/* IOT3-65 — quét nhãn nhanh hơn hẳn gõ tay `GW-ESP32-001` khi đang đứng trước tủ pin. */}
        <Pressable
          hitSlop={10}
          style={styles.scanBtn}
          onPress={() => router.push('/(staff)/tools/devices/scan')}
        >
          <Ionicons name="qr-code-outline" size={20} color={Colors.primaryDark} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textMute} />
        <TextInput
          style={styles.searchInput}
          value={keywordInput}
          onChangeText={setKeywordInput}
          placeholder="Search by device code or name"
          placeholderTextColor={Colors.textFaint}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {keywordInput.length > 0 && (
          <Pressable hitSlop={10} onPress={() => setKeywordInput('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMute} />
          </Pressable>
        )}
      </View>

      <View style={styles.chipsRow}>
        {STATUS_FILTERS.map((f) => {
          const active = f.value === status;
          return (
            <Pressable
              key={f.label}
              onPress={() => setStatus(f.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {query.isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primaryDark} />
      ) : query.isError ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.textFaint} />
          <Text style={styles.emptyText}>Could not load the device list.</Text>
          <Pressable style={styles.retryBtn} onPress={() => query.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/(staff)/tools/devices/${item.id}`)}>
              <DeviceStatusCard device={item} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="hardware-chip-outline" size={40} color={Colors.textFaint} />
              <Text style={styles.emptyText}>
                {keyword || status ? 'No device matches the filter.' : 'No devices yet.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerSpacer: { width: 44 },
  scanBtn: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryDark },
  chipText: { fontSize: 13, color: Colors.textMute, fontWeight: '600' },
  chipTextActive: { color: Colors.primaryDark },
  list: { padding: 16 },
  loader: { marginTop: 40 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMute, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
});
