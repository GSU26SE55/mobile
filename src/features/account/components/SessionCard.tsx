import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDateTime } from '@/src/lib/date';
import { Colors, Shadow } from '@/src/lib/theme';
import { SessionDto } from '../types/account.types';

interface Props {
  session: SessionDto;
  onRevoke: (id: string) => void;
  isRevoking?: boolean;
}

export function SessionCard({ session, onRevoke, isRevoking }: Props) {
  const issuedAt = formatDateTime(session.issuedAt);
  const device = session.userAgent
    ? session.userAgent.slice(0, 50) + (session.userAgent.length > 50 ? '...' : '')
    : 'Unknown device';

  return (
    <View style={[styles.card, session.isCurrent && styles.currentCard, Shadow]}>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.device} numberOfLines={1}>{device}</Text>
          {session.isCurrent && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>This device</Text>
            </View>
          )}
        </View>
        {session.ipAddress ? <Text style={styles.meta}>IP: {session.ipAddress}</Text> : null}
        <Text style={styles.meta}>Signed in: {issuedAt}</Text>
      </View>

      {!session.isCurrent && (
        <Pressable style={styles.revokeBtn} onPress={() => onRevoke(session.id)} disabled={isRevoking}>
          {isRevoking ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <Text style={styles.revokeText}>Revoke</Text>
          )}
        </Pressable>
      )}
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
  device: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '600' },
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
