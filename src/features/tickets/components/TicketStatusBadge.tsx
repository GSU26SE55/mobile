import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BadgeColors } from '@/src/lib/theme';
import { TicketStatusEnum } from '../types/ticket.types';
import { TICKET_STATUS_LABELS, ticketStatusLabel } from '../utils/ticketLabels';

// Human-readable ticket status labels.
const STATUS_CONFIG: Record<TicketStatusEnum, { label: string; badge: keyof typeof BadgeColors }> = {
  Open:                   { label: TICKET_STATUS_LABELS.Open, badge: 'open' },
  Pending:                { label: TICKET_STATUS_LABELS.Pending, badge: 'waiting' },
  InProgress:             { label: 'In progress',            badge: 'progress' },
  Request:                { label: TICKET_STATUS_LABELS.Request, badge: 'escalated' },
  ReAssign:               { label: TICKET_STATUS_LABELS.ReAssign, badge: 'escalated' },
  Completed:              { label: TICKET_STATUS_LABELS.Completed, badge: 'resolved' },
  Closed:                 { label: 'Closed',                 badge: 'closed' },
  ClosedRejected:         { label: 'Rejected',               badge: 'crit' },
};

/**
 * Status label for places that only need text (for example, ActivityTimeline).
 * Returns the original string when the backend sends an unknown value.
 */
export const statusLabel = ticketStatusLabel;

interface Props {
  status: TicketStatusEnum;
}

export function TicketStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: status, badge: 'new' as const };
  const colors = BadgeColors[config.badge];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
});
