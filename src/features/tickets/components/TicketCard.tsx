import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TicketDTO } from '../types/ticket.types';
import { SlaCountdown } from './SlaCountdown';
import { TicketStatusBadge } from './TicketStatusBadge';

const PRIORITY_LABEL: Record<string, string> = {
  P1Critical: 'P1 · Critical',
  P2High:     'P2 · High',
  P3Normal:   'P3 · Standard',
};

const PRIORITY_COLOR: Record<string, string> = {
  P1Critical: '#E53935',
  P2High:     '#FB8C00',
  P3Normal:   '#757575',
};

interface Props {
  ticket: TicketDTO;
  onPress: () => void;
}

export function TicketCard({ ticket, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.code}>{ticket.code}</Text>
        <Text style={[styles.priority, { color: PRIORITY_COLOR[ticket.priority] ?? '#333' }]}>
          {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
        </Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{ticket.title}</Text>
      <View style={styles.footer}>
        <TicketStatusBadge status={ticket.status} />
        <Text style={styles.date}>
          {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      <SlaCountdown sla={ticket.slaTimer} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code:     { fontSize: 12, color: '#666', fontFamily: 'monospace' },
  priority: { fontSize: 12, fontWeight: '700' },
  title:    { fontSize: 15, fontWeight: '600', color: '#111' },
  footer:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date:     { fontSize: 12, color: '#999' },
});
