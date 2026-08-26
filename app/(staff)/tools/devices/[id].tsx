import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/src/lib/theme';
import { BackButton } from '@/src/shared/components/ScreenHeader';
import { useIotDevices } from '@/src/features/iot-devices/hooks/useIotDevices';
import { useDeviceHeartbeats } from '@/src/features/iot-devices/hooks/useDeviceHeartbeats';
import {
  useIotDeviceDetail,
  useRotateIotDeviceKey,
  useRotateIotDeviceMqtt,
} from '@/src/features/iot-devices/hooks/useIotDeviceMutations';
import DeviceKeyRevealModal, {
  fromCreatedDto,
  fromDetailDto,
  type DeviceSecrets,
} from '@/src/features/iot-devices/components/DeviceKeyRevealModal';
import {
  DeviceStatusCard,
  formatRelative,
} from '@/src/features/iot-devices/components/DeviceStatusCard';
import {
  IotDeviceHeartbeatDto,
  IotDeviceStatusEnum,
} from '@/src/features/iot-devices/types/iot-device.types';

/**
 * IOT3-63 — chi tiết thiết bị + lịch sử heartbeat.
 *
 * Bốn con số trong mỗi heartbeat trả lời được gần hết các câu hỏi hiện trường mà không cần tháo
 * tủ: sóng yếu dần (đổi chỗ ăng-ten) · RAM tụt dần (rò bộ nhớ) · hàng đợi phình (mạng không ra
 * được backend) · uptime tụt về 0 (thiết bị đang khởi động lại vòng vòng).
 */

/** Sóng: −50 mạnh, −75 là ranh giới thực dụng, dưới đó rớt lai rai. */
function rssiTone(rssi: number | null): string {
  if (rssi === null) return Colors.textMute;
  if (rssi >= -60) return Colors.successDark;
  if (rssi >= -75) return Colors.warningDark;
  return Colors.dangerDark;
}

function formatUptime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}p`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function HeartbeatRow({ item }: { item: IotDeviceHeartbeatDto }) {
  // Hàng đợi > 0 nghĩa là số đo ĐANG bị giữ lại trên thiết bị — đây là dấu hiệu sớm nhất của
  // "mất dữ liệu", sớm hơn hẳn việc nhìn vào biểu đồ thấy thiếu điểm.
  const queued = item.queuedReadingCount ?? 0;
  return (
    <View style={styles.hbRow}>
      <Text style={styles.hbTime}>{formatRelative(item.time)}</Text>
      <View style={styles.hbMetrics}>
        <Text style={[styles.hbMetric, { color: rssiTone(item.rssiDbm) }]}>
          {item.rssiDbm !== null ? `${item.rssiDbm} dBm` : '—'}
        </Text>
        <Text style={styles.hbMetric}>
          RAM {item.freeMemoryPercent !== null ? `${Number(item.freeMemoryPercent).toFixed(0)}%` : '—'}
        </Text>
        <Text style={styles.hbMetric}>up {formatUptime(item.uptimeSeconds)}</Text>
        <Text style={[styles.hbMetric, queued > 0 && styles.hbMetricWarn]}>
          hàng đợi {queued}
        </Text>
      </View>
    </View>
  );
}

export default function DeviceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const deviceId = typeof id === 'string' ? id : '';

  // Header/stat card still reads from the same list the previous screen already loaded —
  // TanStack Query returns it straight from cache, no extra request.
  const list = useIotDevices({ pageSize: 50, sortBy: 'lastSeenAt', sortDir: 'desc' });
  const device = list.data?.items.find((d) => d.id === deviceId);

  // Detail-only call for the quick actions below: `GET /api/admin/iot-devices/{id}` was opened
  // to Staff so "View details" can show the re-readable apiKey/QR/MQTT, same as the web app.
  const { data: detail } = useIotDeviceDetail(deviceId);
  const { mutate: rotateKey, isPending: rotatingKey } = useRotateIotDeviceKey(deviceId);
  const { mutate: rotateMqtt, isPending: rotatingMqtt } = useRotateIotDeviceMqtt(deviceId);
  const [revealed, setRevealed] = useState<DeviceSecrets | null>(null);
  const isDecommissioned = device?.status === IotDeviceStatusEnum.Decommissioned;

  const confirmRotateMqtt = () => {
    Alert.alert(
      'Rotate MQTT key?',
      'Changes only the MQTT username/password. The API key STAYS THE SAME, so the device calls /provision itself to fetch the new password — NO site visit needed. While it waits, the device temporarily loses MQTT but keeps sending data over HTTPS.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rotate MQTT key',
          onPress: () =>
            rotateMqtt(undefined, {
              onSuccess: (res) => {
                if (res.data) setRevealed(fromCreatedDto(res.data));
              },
              onError: () =>
                Alert.alert('Error', 'Could not rotate the MQTT key. Please try again.'),
            }),
        },
      ],
    );
  };

  const confirmRotateKey = () => {
    Alert.alert(
      'Rotate API key?',
      'Changes BOTH the API key AND the MQTT key. The device loses both channels and CANNOT recover on its own — someone must go on site with a cable and flash the new API key. Use this only when the API key is suspected leaked; to change just the MQTT key use Rotate MQTT key.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rotate',
          style: 'destructive',
          onPress: () =>
            rotateKey(undefined, {
              onSuccess: (res) => {
                if (res.data) setRevealed(fromCreatedDto(res.data));
              },
              onError: () => Alert.alert('Error', 'Could not rotate the API key. Please try again.'),
            }),
        },
      ],
    );
  };

  const heartbeats = useDeviceHeartbeats(deviceId, { limit: 50 });
  const items = heartbeats.data?.items ?? [];

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <Text style={styles.topTitle} numberOfLines={1}>
          {device?.deviceCode ?? 'Device detail'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(h) => h.time}
        contentContainerStyle={styles.list}
        refreshing={heartbeats.isRefetching || list.isRefetching}
        onRefresh={() => {
          heartbeats.refetch();
          list.refetch();
        }}
        ListHeaderComponent={
          <View>
            {list.isLoading ? (
              <ActivityIndicator style={styles.loader} color={Colors.primaryDark} />
            ) : device ? (
              <>
                <DeviceStatusCard device={device} />
                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.actionBtn}
                    disabled={!detail}
                    onPress={() => detail && setRevealed(fromDetailDto(detail))}
                  >
                    <Text style={styles.actionBtnText}>View details</Text>
                  </Pressable>
                  {!isDecommissioned && (
                    <Pressable
                      style={styles.actionBtn}
                      disabled={rotatingMqtt}
                      onPress={confirmRotateMqtt}
                    >
                      <Text style={styles.actionBtnText}>
                        {rotatingMqtt ? 'Rotating…' : 'Rotate MQTT key'}
                      </Text>
                    </Pressable>
                  )}
                  {!isDecommissioned && (
                    <Pressable
                      style={styles.actionBtn}
                      disabled={rotatingKey}
                      onPress={confirmRotateKey}
                    >
                      <Text style={styles.actionBtnText}>
                        {rotatingKey ? 'Rotating…' : 'Rotate key'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  Không tìm thấy thiết bị trong danh sách hiện tại. Lịch sử heartbeat bên dưới
                  vẫn tải theo id.
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Heartbeat history</Text>
            {heartbeats.isLoading && (
              <ActivityIndicator style={styles.loader} color={Colors.primaryDark} />
            )}
            {heartbeats.isError && (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>Could not load the heartbeat history.</Text>
                <Pressable style={styles.retryBtn} onPress={() => heartbeats.refetch()}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => <HeartbeatRow item={item} />}
        ListEmptyComponent={
          !heartbeats.isLoading && !heartbeats.isError ? (
            <View style={styles.empty}>
              <Ionicons name="pulse-outline" size={36} color={Colors.textFaint} />
              <Text style={styles.emptyText}>
                Thiết bị chưa gửi heartbeat nào. Nếu vừa lắp xong, chờ hết một nhịp heartbeat
                {device ? ` (${device.heartbeatIntervalSeconds}s)` : ''} rồi kéo để làm mới.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          heartbeats.data?.hasMore ? (
            // Cố ý KHÔNG làm cuộn vô hạn: màn hình này để trả lời "thiết bị có khoẻ không",
            // và 50 mẫu gần nhất đã đủ. Cuộn qua hàng triệu bản ghi trên điện thoại chỉ tốn RAM.
            <Text style={styles.footerNote}>
              Hiển thị 50 mẫu gần nhất. Cần xem xa hơn thì dùng bản web.
            </Text>
          ) : null
        }
      />

      <DeviceKeyRevealModal
        visible={!!revealed}
        device={revealed}
        onClose={() => setRevealed(null)}
      />
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
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  list: { padding: 16 },
  loader: { marginVertical: 20 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 4 },
  actionBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.card,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: Colors.text },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 6, marginBottom: 8 },
  hbRow: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hbTime: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  hbMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  hbMetric: { fontSize: 12, color: Colors.textMute, fontWeight: '600' },
  hbMetricWarn: { color: Colors.warningDark },
  notice: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  noticeText: { fontSize: 13, color: Colors.textMute, lineHeight: 18 },
  empty: { alignItems: 'center', paddingTop: 30, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.textMute, textAlign: 'center', lineHeight: 19 },
  footerNote: { fontSize: 12, color: Colors.textFaint, textAlign: 'center', paddingVertical: 12 },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
});
