import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import type { TicketDTO } from '../types/ticket.types';
import { PAUSE_REASON_LABELS, PENDING_CONTEXT_LABELS } from '../utils/ticketLabels';
import { formatLocalSchedule } from '../utils/scheduleTime';

export function PendingContextCard({ ticket }: { ticket: Pick<TicketDTO, 'status' | 'pendingContext' | 'pendingReason' | 'scheduledStartAtUtc'> }) {
  if (ticket.status !== 'Pending') return null;
  return <View style={styles.card} accessibilityLabel="Pending ticket details">
    <Text style={styles.title}>{ticket.pendingContext ? PENDING_CONTEXT_LABELS[ticket.pendingContext] : 'Pending update'}</Text>
    {ticket.pendingReason ? <Text style={styles.text}>Reason: {PAUSE_REASON_LABELS[ticket.pendingReason]}</Text> : null}
    <Text style={styles.text}>
      {ticket.pendingContext === 'Held' ? 'Rescheduled to: ' : ''}
      {formatLocalSchedule(ticket.scheduledStartAtUtc)}
    </Text>
  </View>;
}

const styles = StyleSheet.create({ card: { backgroundColor: Colors.card2, padding: 12, borderRadius: 14, gap: 5 }, title: { color: Colors.text, fontWeight: '800' }, text: { color: Colors.textMute, fontSize: 12 } });
