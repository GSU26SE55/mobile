import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '@/src/lib/theme';
import { IotDeviceCalibrationDto } from '../types/iot-device.types';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const d = new Date(expiresAt);
  return !Number.isNaN(d.getTime()) && d.getTime() <= Date.now();
}

export function CalibrationCard({
  item,
  onDelete,
  deleting,
}: {
  item: IotDeviceCalibrationDto;
  onDelete: () => void;
  deleting?: boolean;
}) {
  const expired = isExpired(item.expiresAt);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.channelBadge}>
          <Text style={styles.channelText}>{item.channel}</Text>
        </View>
        {expired && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>Expired</Text>
          </View>
        )}
        <Pressable hitSlop={10} onPress={onDelete} disabled={deleting} style={styles.deleteBtn}>
          {deleting ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          )}
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>scale {item.scale}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>offset {item.offset}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>{item.unit}</Text>
      </View>

      <Text style={styles.line}>Calib: {formatDate(item.calibratedAt)}</Text>
      <Text style={styles.line}>Expires: {formatDate(item.expiresAt)}</Text>
      {item.batteryAssetId ? (
        <Text style={styles.line} numberOfLines={1}>
          Battery: {item.batteryAssetId}
        </Text>
      ) : (
        <Text style={styles.line}>Scope: device-level</Text>
      )}
      {item.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {item.notes}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    ...Shadow,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  channelBadge: {
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  channelText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  expiredBadge: {
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  expiredText: { fontSize: 11, fontWeight: '700', color: Colors.danger },
  deleteBtn: { marginLeft: 'auto', padding: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  meta: { fontSize: 13, color: Colors.text },
  dot: { fontSize: 13, color: Colors.textMute, marginHorizontal: 6 },
  line: { fontSize: 12, color: Colors.textMute, marginTop: 4 },
  notes: { fontSize: 12, color: Colors.text, marginTop: 6, fontStyle: 'italic' },
});
