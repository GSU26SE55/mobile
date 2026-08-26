import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BadgeColors } from '@/src/lib/theme';
import { TicketStatusEnum } from '../types/ticket.types';
import { TicketAudience, ticketChip, ticketStatusLabel, ticketTone } from '../utils/ticketLabels';

/**
 * Status label for places that only need text (for example, ActivityTimeline),
 * where the long precise wording is the right call.
 */
export const statusLabel = ticketStatusLabel;

interface Props {
  status: TicketStatusEnum;
  /** Picks the vocabulary — customers read five words, staff seven. */
  audience?: TicketAudience;
}

export function TicketStatusBadge({ status, audience = 'staff' }: Props) {
  const colors = BadgeColors[ticketTone(status)];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]}>{ticketChip(status, audience)}</Text>
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
    fontWeight: '700',
    lineHeight: 14,
  },
});
