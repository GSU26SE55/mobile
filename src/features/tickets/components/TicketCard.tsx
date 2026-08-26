import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDate } from '@/src/lib/date';
import { Colors, Font, Solar } from '@/src/lib/theme';
import { PressableScale } from '@/src/shared/components/motion';
import { TicketDTO } from '../types/ticket.types';
import { assignmentSummary } from '../utils/assignments';
import { categoryLabel, priorityMeta, ticketChip, TicketAudience } from '../utils/ticketLabels';
import { showsSlaInList } from '../utils/ticketWorkflow';
import { SlaCountdown } from './SlaCountdown';

/**
 * The one ticket row for both roles.
 *
 * Priority leads the card as a filled P1/P2/P3 pill — the only coloured element
 * in the top row, so severity reads first. The old card buried it in a 10px pill
 * among five competing elements at `gap: 6`.
 *
 * Status sits next to it as one plain word, never in the meta line — it used to
 * be the third of four `·`-joined items and got truncated away on a 360dp
 * screen. `audience` picks the vocabulary: customers read five words, staff
 * seven (see TICKET_STAGE).
 */
interface Props {
  ticket: TicketDTO;
  onPress: () => void;
  audience?: TicketAudience;
  /** Staff only: Primary / Supporter / Previous on this ticket. */
  roleBadge?: { label: string; bg: string; text: string } | null;
  showAssignee?: boolean;
}

function TicketCardBase({
  ticket,
  onPress,
  audience = 'customer',
  roleBadge = null,
  showAssignee = true,
}: Props) {
  const priority = priorityMeta(ticket.priority);
  const showSla =
    !!ticket.slaTimer &&
    showsSlaInList(ticket.status, ticket.priority, ticket.slaTimer.status);

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" scaleTo={0.98}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View
            style={[styles.priorityPill, { backgroundColor: priority.chipBg }]}
            accessibilityLabel={priority.short}
          >
            <Text style={[styles.priorityCode, { color: priority.chipText }]}>
              {priority.code}
            </Text>
          </View>

          <Text style={styles.status} numberOfLines={1}>
            {ticketChip(ticket.status, audience)}
          </Text>

          {roleBadge && (
            <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
              <Text style={[styles.roleText, { color: roleBadge.text }]}>{roleBadge.label}</Text>
            </View>
          )}

          <View style={styles.spacer} />

          {ticket.hasUnreadChat && (
            <Ionicons
              name="chatbubble-ellipses"
              size={14}
              color={Solar.yellowDeep}
              accessibilityLabel="Unread messages"
            />
          )}

          {showSla && ticket.slaTimer && <SlaCountdown sla={ticket.slaTimer} compact />}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {ticket.title || ticket.code}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.meta} numberOfLines={1}>
            {ticket.code} · {categoryLabel(ticket.category)} · {formatDate(ticket.createdAt)}
          </Text>
          {showAssignee && (
            <View style={styles.assignee}>
              <Ionicons name="person-circle-outline" size={14} color={Solar.mute} />
              <Text style={styles.metaStrong} numberOfLines={1}>
                {assignmentSummary(ticket.assignments)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </PressableScale>
  );
}

/**
 * Memoised: the list re-renders on every refetch and on each SLA tick. Without
 * this, a countdown updating in one row re-renders all of them.
 */
export const TicketCard = React.memo(TicketCardBase);

const styles = StyleSheet.create({
  // A plain View, not GlassSurface. The glass gradient runs
  // rgba(255,255,255,.98) → rgba(255,252,244,.94) — invisible at card size, but
  // it costs a LinearGradient plus its own compositing layer on EVERY row.
  // Solid `Solar.card` is the same colour for one flat draw.
  card: {
    backgroundColor: Solar.card,
    borderRadius: 20,
    marginBottom: 12,
    padding: 14,
    gap: 8,
    shadowColor: Solar.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spacer: { flex: 1 },

  priorityPill: {
    minWidth: 34,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
  },
  priorityCode: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  // One plain word. The filter chip already scopes the list, so this does not
  // need its own colour competing with the priority pill.
  status: { ...Font.meta, color: Solar.ink2, flexShrink: 1 },

  roleBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  roleText: { fontSize: 10, fontWeight: '700' },

  title: { ...Font.body, lineHeight: 20 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  meta: { ...Font.meta, flexShrink: 1 },
  metaStrong: { ...Font.meta, color: Solar.ink2 },
  assignee: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '45%' },
});
