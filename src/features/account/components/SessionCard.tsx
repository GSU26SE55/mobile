import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SessionDto } from '../types/account.types';

interface Props {
  session: SessionDto;
  onRevoke: (id: string) => void;
  isRevoking?: boolean;
}

export function SessionCard({ session, onRevoke, isRevoking }: Props) {
  const issuedAt = new Date(session.issuedAt).toLocaleString('vi-VN');
  const device = session.userAgent
    ? session.userAgent.slice(0, 50) + (session.userAgent.length > 50 ? '…' : '')
    : 'Thiết bị không xác định';

  return (
    <View style={[styles.card, session.isCurrent && styles.currentCard]}>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.device} numberOfLines={1}>{device}</Text>
          {session.isCurrent && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Thiết bị này</Text>
            </View>
          )}
        </View>
        {session.ipAddress ? (
          <Text style={styles.meta}>IP: {session.ipAddress}</Text>
        ) : null}
        <Text style={styles.meta}>Đăng nhập: {issuedAt}</Text>
      </View>

      {!session.isCurrent && (
        <Pressable
          style={styles.revokeBtn}
          onPress={() => onRevoke(session.id)}
          disabled={isRevoking}
        >
          {isRevoking ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Text style={styles.revokeText}>Thu hồi</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:        {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, backgroundColor: '#fff',
    borderRadius: 10, marginBottom: 8,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  currentCard: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  info:        { flex: 1, gap: 4 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  device:      { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },
  badge:       {
    backgroundColor: '#6366f1', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText:   { color: '#fff', fontSize: 11, fontWeight: '600' },
  meta:        { fontSize: 12, color: '#6b7280' },
  revokeBtn:   {
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#ef4444', borderRadius: 6,
  },
  revokeText:  { color: '#ef4444', fontSize: 13, fontWeight: '500' },
});
