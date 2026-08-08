import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BadgeColors } from '@/src/lib/theme';
import { TicketStatusEnum } from '../types/ticket.types';

// Human-readable ticket status labels.
const STATUS_CONFIG: Record<TicketStatusEnum, { label: string; badge: keyof typeof BadgeColors }> = {
  New:                    { label: 'New',                    badge: 'new' },
  Open:                   { label: 'Awaiting triage',        badge: 'open' },
  Assigned:               { label: 'Assigned',               badge: 'assigned' },
  InProgress:             { label: 'In progress',            badge: 'progress' },
  WaitingCustomer:        { label: 'Waiting for customer',   badge: 'waiting' },
  WaitingParts:           { label: 'Waiting for parts',      badge: 'waiting' },
  WaitingOnsiteSchedule:  { label: 'Waiting for appointment', badge: 'waiting' },
  Resolved:               { label: 'Resolved',               badge: 'resolved' },
  Escalated:              { label: 'Escalated',              badge: 'escalated' },
  ClosedPendingRate:      { label: 'Awaiting rating',        badge: 'closed' },
  Closed:                 { label: 'Closed',                 badge: 'closed' },
  ClosedRejected:         { label: 'Rejected',               badge: 'crit' },
  Incident:               { label: 'Incident',               badge: 'crit' },
};

/**
 * Status label for places that only need text (for example, ActivityTimeline).
 * Returns the original string when the backend sends an unknown value.
 */
export const statusLabel = (status: string) =>
  STATUS_CONFIG[status as TicketStatusEnum]?.label ?? status;

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
