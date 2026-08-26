import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate, formatDateTime } from '@/src/lib/date';
import { Colors, Shadow } from '@/src/lib/theme';
import { TrustedDeviceDto } from '../types/account.types';

interface Props {
  device: TrustedDeviceDto;
  onRevoke: (id: string) => void;
  isRevoking?: boolean;
}

export function TrustedDeviceCard({ device, onRevoke, isRevoking }: Props) {
  const trustedAt = formatDate(device.trustedAt);
  const expiresAt = formatDate(device.expiresAt);
  const lastUsed = device.lastUsedAt ? formatDateTime(device.lastUsedAt) : 'Not used yet';

  return (
    <View style={[styles.card, device.isCurrentDevice && styles.currentCard, Shadow]}>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>{device.label}</Text>
          {device.isCurrentDevice && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>This device</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>Network: {device.ipPrefix}</Text>
        <Text style={styles.meta}>Trusted since: {trustedAt} · Expires: {expiresAt}</Text>
        <Text style={styles.meta}>Last used: {lastUsed} · {device.usageCount} times</Text>
      </View>

      <Pressable style={styles.revokeBtn} onPress={() => onRevoke(device.id)} disabled={isRevoking}>
        {isRevoking ? (
          <ActivityIndicator size="small" color={Colors.danger} />
        ) : (
          <Text style={styles.revokeText}>Revoke</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, backgroundColor: Colors.card,
    borderRadius: 16, marginBottom: 8,
  },
  currentCard: { borderWidth: 1.5, borderColor: Colors.primary },
  info: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '600' },
  badge: {
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  meta: { fontSize: 11, color: Colors.textMute },
  revokeBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 10,
  },
  revokeText: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
});
