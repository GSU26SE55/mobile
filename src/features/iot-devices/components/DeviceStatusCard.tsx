import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/src/lib/theme';
import { IotDeviceDto } from '../types/iot-device.types';
import { IOT_DEVICE_STATUS_LABEL, IotDeviceStatusEnum } from '../enums/iot-device.enum';

/**
 * IOT3-61 — thẻ trạng thái thiết bị.
 *
 * Dùng chung ở màn hình calibration, danh sách và chi tiết, để cùng một con số không được hiển
 * thị hai kiểu ở ba nơi.
 *
 * Bốn dữ kiện chọn hiển thị là bốn thứ trả lời được "vì sao thiết bị này im lặng" mà không phải
 * ra hiện trường: thấy lần cuối · firmware · lệch đồng hồ · hàng đợi. Ba trong bốn cái đó API
 * đã trả từ IoT-2 nhưng chưa từng được hiện lên.
 */

/** Màu theo trạng thái — đỏ/cam/xanh chứ không phải chữ, để nhìn lướt là biết. */
function statusTone(status: IotDeviceStatusEnum): { bg: string; fg: string } {
  switch (status) {
    case IotDeviceStatusEnum.Active:
      return { bg: Colors.successLight, fg: Colors.successDark };
    case IotDeviceStatusEnum.Offline:
      return { bg: Colors.dangerLight, fg: Colors.dangerDark };
    case IotDeviceStatusEnum.Pending:
      return { bg: Colors.warningLight, fg: Colors.warningDark };
    default:
      // Disabled / Decommissioned — xám: không phải sự cố, là quyết định của người quản trị.
      return { bg: Colors.card3, fg: Colors.textMute };
  }
}

/**
 * "3 phút trước" dễ đọc hơn hẳn một mốc ISO khi đang đứng trước tủ pin.
 */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'chưa từng';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diffSec = Math.round((Date.now() - t) / 1000);
  if (diffSec < 0) return 'vừa xong';        // đồng hồ máy lệch — đừng hiện "-5 phút trước"
  if (diffSec < 60) return `${diffSec} giây trước`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  return `${Math.floor(diffSec / 86400)} ngày trước`;
}

/**
 * Lệch đồng hồ: vượt ±300 s là backend TỪ CHỐI provision (§52.3), nên phải cảnh báo TRƯỚC khi
 * chạm ngưỡng — chạm rồi thì thiết bị đã ngừng hoạt động và người dùng chỉ thấy nó "im lặng".
 */
function skewTone(seconds: number | null): { text: string; danger: boolean } {
  if (seconds === null || seconds === undefined) return { text: '—', danger: false };
  const abs = Math.abs(seconds);
  return {
    text: `${seconds > 0 ? '+' : ''}${Math.round(seconds)} s`,
    danger: abs >= 120,   // 120 s: còn xa ngưỡng 300 nhưng đã đủ để đi kiểm NTP
  };
}

function Row({
  icon,
  label,
  value,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={15} color={danger ? Colors.dangerDark : Colors.textMute} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, danger && styles.rowValueDanger]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function DeviceStatusCard({ device }: { device: IotDeviceDto }) {
  const tone = statusTone(device.status);
  const skew = skewTone(device.lastClockSkewSeconds);

  // Firmware đích khác firmware đang chạy ⇒ đang chờ OTA. Không nói ra thì kỹ thuật viên sẽ
  // tưởng thiết bị đã ở bản mới vì admin "đã bấm cập nhật rồi".
  const otaPending =
    !!device.targetFirmwareVersion &&
    device.targetFirmwareVersion !== device.currentFirmwareVersion;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.code}>{device.deviceCode}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {device.displayName}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <Text style={[styles.badgeText, { color: tone.fg }]}>
            {IOT_DEVICE_STATUS_LABEL[device.status] ?? 'Không rõ'}
          </Text>
        </View>
      </View>

      <Row icon="time-outline" label="Thấy lần cuối" value={formatRelative(device.lastSeenAt)} />
      <Row
        icon="hardware-chip-outline"
        label="Firmware"
        value={
          otaPending
            ? `${device.currentFirmwareVersion ?? '—'} → ${device.targetFirmwareVersion} (chờ OTA)`
            : (device.currentFirmwareVersion ?? '—')
        }
        danger={otaPending}
      />
      <Row
        icon="stopwatch-outline"
        label="Lệch đồng hồ"
        value={skew.text}
        danger={skew.danger}
      />
      <Row
        icon="pulse-outline"
        label="Nhịp heartbeat"
        value={`${device.heartbeatIntervalSeconds}s`}
      />
      {!!device.siteName && (
        <Row icon="business-outline" label="Địa điểm" value={device.siteName} />
      )}
      {!!device.apiKeyLastFour && (
        <Row icon="key-outline" label="API key" value={`••••${device.apiKeyLastFour}`} />
      )}

      {skew.danger && (
        <Text style={styles.hint}>
          Đồng hồ lệch nhiều — quá ±300 s backend sẽ từ chối provision. Kiểm tra thiết bị có ra
          được máy chủ NTP không.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  headerText: { flex: 1, paddingRight: 8 },
  code: { fontSize: 15, fontWeight: '700', color: Colors.text },
  name: { fontSize: 13, color: Colors.textMute, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 13, color: Colors.textMute, marginLeft: 8, width: 118 },
  rowValue: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  rowValueDanger: { color: Colors.dangerDark },
  hint: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.dangerDark,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.sm,
    padding: 8,
  },
});
