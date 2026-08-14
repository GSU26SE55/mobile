import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate } from '@/src/lib/date';
import { BadgeColors, Solar } from '@/src/lib/theme';
import { TicketDTO } from '../types/ticket.types';
import { assignmentSummary } from '../utils/assignments';
import { SlaCountdown } from './SlaCountdown';
import { TicketStatusBadge } from './TicketStatusBadge';
import { GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';
import { shouldShowLiveSla } from '../utils/ticketWorkflow';

const PRIORITY_BADGE: Record<string, keyof typeof BadgeColors> = {
  P1Critical: 'p1',
  P2High:     'p2',
  P3Normal:   'p3',
};

const PRIORITY_LABEL: Record<string, string> = {
  P1Critical: 'P1',
  P2High:     'P2',
  P3Normal:   'P3',
};

const CATEGORY_LABEL: Record<string, string> = {
  Charging: 'Charging',
  Overheat: 'Overheating',
  NoPower: 'Power outage',
  Performance: 'Performance',
  Repair: 'Repair',
  Other: 'Other',
};

interface Props {
  ticket: TicketDTO;
  onPress: () => void;
}

export function TicketCard({ ticket, onPress }: Props) {
  const pKey = ticket.priority ? (PRIORITY_BADGE[ticket.priority] ?? 'p3') : 'p3';
  const pColors = BadgeColors[pKey];
  const pLabel = ticket.priority
    ? (PRIORITY_LABEL[ticket.priority] ?? ticket.priority)
    : 'Unclassified';

  // BE trả kèm `staffName` trong assignments nên card hiện được TÊN thật.
  // Nhiều người thì chỉ show 2 tên đầu, dư bao nhiêu đếm số (xem assignmentSummary).
  const technicianName = assignmentSummary(ticket.assignments);

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <GlassSurface style={[styles.card, pressed && styles.pressed]}>
          {/* Top Header Row */}
          <View style={styles.topRow}>
            <Text style={styles.code}>{ticket.code}</Text>

            {/* Chat chưa đọc — BE tính sẵn theo user hiện tại. Dùng icon thay chấm
                trơn: hàng này đã có dot ưu tiên + 2 badge, thêm chấm nữa dễ lẫn. */}
            {ticket.hasUnreadChat && (
              <Ionicons
                name="chatbubble-ellipses"
                size={14}
                color={Solar.yellowDeep}
                accessibilityLabel="Unread messages"
              />
            )}

            {/* Priority Badge */}
            <View style={[styles.priorityBadge, { backgroundColor: pColors.bg }]}>
              <View style={[styles.dot, { backgroundColor: pColors.text }]} />
              <Text style={[styles.priorityText, { color: pColors.text }]}>{pLabel}</Text>
            </View>

            {/* Status Badge */}
            <TicketStatusBadge status={ticket.status} />

            <View style={{ flex: 1 }} />

            {/* SLA remaining */}
      {ticket.slaTimer && shouldShowLiveSla(ticket.status, ticket.priority, ticket.slaTimer.status) && <SlaCountdown sla={ticket.slaTimer} compact />}
          </View>

          {/* Title */}
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>{ticket.title}</Text>
          </View>

          {/* Footer Row */}
          <View style={styles.footer}>
            <Text style={styles.subtitle} numberOfLines={1}>
              {CATEGORY_LABEL[ticket.category] ?? ticket.category} · {formatDate(ticket.createdAt)}
            </Text>
            <View style={styles.technicianWrap}>
              <Ionicons name="person-circle-outline" size={14} color={Solar.mute} />
              <Text style={styles.technicianText}>{technicianName}</Text>
            </View>
          </View>
        </GlassSurface>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  code: {
    fontSize: 11,
    fontWeight: '800',
    color: Solar.mute,
    letterSpacing: 0.2,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  body: {},
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: Solar.ink,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(235, 230, 215, 0.6)',
  },
  subtitle: {
    fontSize: 11,
    color: Solar.mute,
    fontWeight: '600',
  },
  technicianWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  technicianText: {
    fontSize: 11,
    color: Solar.mute,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
