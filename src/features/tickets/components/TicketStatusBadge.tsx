import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BadgeColors } from '../../../lib/theme';
import { TicketStatusEnum } from '../types/ticket.types';

const STATUS_CONFIG: Record<TicketStatusEnum, { label: string; badge: keyof typeof BadgeColors }> = {
  New:                    { label: 'NEW',            badge: 'new' },
  Open:                   { label: 'OPEN',           badge: 'open' },
  Approved:               { label: 'APPROVED',       badge: 'ok' },
  Assigned:               { label: 'ASSIGNED',       badge: 'assigned' },
  InProgress:             { label: 'IN PROGRESS',    badge: 'progress' },
  WaitingCustomer:        { label: 'WAITING',        badge: 'waiting' },
  WaitingParts:           { label: 'WAITING',        badge: 'waiting' },
  WaitingOnsiteSchedule:  { label: 'WAITING',        badge: 'waiting' },
  Resolved:               { label: 'RESOLVED',       badge: 'resolved' },
  Escalated:              { label: 'ESCALATED',      badge: 'escalated' },
  ClosedPendingRate:      { label: 'PENDING RATE',   badge: 'closed' },
  Closed:                 { label: 'CLOSED',         badge: 'closed' },
  ClosedRejected:         { label: 'REJECTED',       badge: 'crit' },
  Incident:               { label: 'INCIDENT',       badge: 'crit' },
};

interface Props {
  status: TicketStatusEnum;
}

export function TicketStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: status, badge: 'new' as const };
  const colors = BadgeColors[config.badge];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <View style={[styles.dot, { backgroundColor: colors.text }]} />
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
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
});
