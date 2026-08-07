import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '@/src/lib/theme';
import { handleErrorApi } from '@/src/lib/errors';
import { useDeviceByCode } from '@/src/features/iot-devices/hooks/useDeviceByCode';
import { useCalibrations } from '@/src/features/iot-devices/hooks/useCalibrations';
import { useDeleteCalibration } from '@/src/features/iot-devices/hooks/useDeleteCalibration';
import { CalibrationCard } from '@/src/features/iot-devices/components/CalibrationCard';
import { deviceCodeSchema } from '@/src/features/iot-devices/schemas/calibration.schema';
import {
  CalibrationChannel,
  CALIBRATION_CHANNEL_LABEL,
  IOT_DEVICE_STATUS_LABEL,
} from '@/src/features/iot-devices/enums/iot-device.enum';
import { BackButton } from '@/src/shared/components/ScreenHeader';

const CHANNELS = Object.values(CalibrationChannel);

export default function CalibrationScreen() {
  const insets = useSafeAreaInsets();
  const [codeInput, setCodeInput] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [channel, setChannel] = useState<string | undefined>(undefined);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const device = useDeviceByCode(submittedCode, !!submittedCode);
  const deviceId = device.data?.id;
  const calibrations = useCalibrations(deviceId, { channel, includeExpired });
  const deleteMut = useDeleteCalibration(deviceId ?? '');

  const onSubmitCode = () => {
    const parsed = deviceCodeSchema.safeParse(codeInput);
    if (!parsed.success) {
      setCodeError(parsed.error.issues[0]?.message ?? 'deviceCode không hợp lệ');
      return;
    }
    setCodeError(null);
    setSubmittedCode(parsed.data);
  };

  const onDelete = (calibrationId: string) => {
    Alert.alert('Xoá calibration', 'Bạn chắc chắn muốn xoá bản hiệu chỉnh này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () => {
          setDeletingId(calibrationId);
          deleteMut.mutate(calibrationId, {
            onError: (error) => handleErrorApi({ error }),
            onSettled: () => setDeletingId(null),
          });
        },
      },
    ]);
  };

  const items = calibrations.data ?? [];
  const deviceNotFound = device.isError && !!submittedCode;

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <Text style={styles.topTitle}>Calibration</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Nhập deviceCode */}
      <View style={styles.searchSection}>
        <Text style={styles.hint}>Nhập mã thiết bị (in trên thân máy, vd ESP32-SIM-001)</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="deviceCode"
            placeholderTextColor={Colors.textMute}
            value={codeInput}
            onChangeText={setCodeInput}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={onSubmitCode}
            returnKeyType="search"
          />
          <Pressable style={styles.searchBtn} onPress={onSubmitCode}>
            <Ionicons name="search" size={18} color="#fff" />
          </Pressable>
        </View>
        {codeError && <Text style={styles.errText}>{codeError}</Text>}
      </View>

      {device.isFetching ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : deviceNotFound ? (
        <View style={styles.center}>
          <Ionicons name="help-circle-outline" size={32} color={Colors.textMute} />
          <Text style={styles.emptyText}>Không tìm thấy thiết bị với mã này.</Text>
        </View>
      ) : device.data ? (
        <>
          {/* Thông tin device + nút thêm */}
          <View style={[styles.deviceCard, Shadow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{device.data.displayName}</Text>
              <Text style={styles.deviceMeta}>
                {device.data.deviceCode}
                {' · '}
                {IOT_DEVICE_STATUS_LABEL[device.data.status] ?? '—'}
                {device.data.siteName ? ` · ${device.data.siteName}` : ''}
              </Text>
            </View>
            <Pressable
              style={styles.addBtn}
              onPress={() =>
                router.push({
                  pathname: '/(staff)/tools/calibration/create',
                  params: { deviceId: device.data!.id, deviceCode: device.data!.deviceCode },
                })
              }
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Thêm</Text>
            </Pressable>
          </View>

          {/* Filter */}
          <View style={styles.filterRow}>
            <FlatList
              horizontal
              data={[undefined, ...CHANNELS]}
              keyExtractor={(c) => c ?? 'all'}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              renderItem={({ item: c }) => {
                const active = channel === c;
                return (
                  <Pressable
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setChannel(c)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {c ? CALIBRATION_CHANNEL_LABEL[c] : 'Tất cả'}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
          <View style={styles.expiredToggle}>
            <Text style={styles.toggleLabel}>Hiện cả đã hết hạn</Text>
            <Switch value={includeExpired} onValueChange={setIncludeExpired} />
          </View>

          {/* List calibration */}
          {calibrations.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : calibrations.isError ? (
            <View style={styles.center}>
              <Ionicons name="alert-circle-outline" size={32} color={Colors.textMute} />
              <Text style={styles.emptyText}>Không tải được calibration.</Text>
              <Pressable onPress={() => calibrations.refetch()} style={[styles.retryBtn, Shadow]}>
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="options-outline" size={32} color={Colors.textMute} />
              <Text style={styles.emptyText}>Thiết bị chưa có bản hiệu chỉnh nào.</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <CalibrationCard
                  item={item}
                  onDelete={() => onDelete(item.id)}
                  deleting={deletingId === item.id}
                />
              )}
            />
          )}
        </>
      ) : (
        <View style={styles.center}>
          <Ionicons name="hardware-chip-outline" size={32} color={Colors.textMute} />
          <Text style={styles.emptyText}>Nhập mã thiết bị để xem calibration.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  headerSpacer: { width: 44 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  searchSection: { paddingHorizontal: 16, paddingBottom: 12 },
  hint: { fontSize: 12, color: Colors.textMute, marginBottom: 8 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, height: 44, backgroundColor: Colors.card, borderRadius: Radius.md, paddingHorizontal: 14, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  searchBtn: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  errText: { fontSize: 12, color: Colors.danger, marginTop: 6 },
  deviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: 14, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  deviceName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  deviceMeta: { fontSize: 12, color: Colors.textMute, marginTop: 3 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  filterRow: { marginBottom: 8 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 14, height: 32, borderRadius: 16, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.text },
  chipTextActive: { color: Colors.text, fontWeight: '700' },
  expiredToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  toggleLabel: { fontSize: 13, color: Colors.text },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMute, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.card, borderRadius: Radius.sm, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
