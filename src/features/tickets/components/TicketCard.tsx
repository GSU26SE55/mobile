import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BadgeColors, Colors, Shadow } from '../../../lib/theme';
import { TicketDTO } from '../types/ticket.types';
import { SlaCountdown } from './SlaCountdown';
import { TicketStatusBadge } from './TicketStatusBadge';

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
  Charging: 'Sạc pin',
  Overheat: 'Quá nhiệt',
  NoPower: 'Mất điện',
  Performance: 'Hiệu suất',
  Repair: 'Sửa chữa',
  Other: 'Khác',
};

interface Props {
  ticket: TicketDTO;
  onPress: () => void;
}

export function TicketCard({ ticket, onPress }: Props) {
  // priority có thể null khi ticket chưa triage — không fallback nhầm sang P3.
  const pKey = ticket.priority ? (PRIORITY_BADGE[ticket.priority] ?? 'p3') : 'p3';
  const pColors = BadgeColors[pKey];
  const pLabel = ticket.priority
    ? (PRIORITY_LABEL[ticket.priority] ?? ticket.priority)
    : 'Chưa phân loại';

  const technicianName = ticket.assignedStaffName ?? (ticket.assignedStaffId ? 'Đã phân công' : 'Chưa phân công');

  return (
    <Pressable style={[styles.card, Shadow]} onPress={onPress}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <Text style={styles.code}>{ticket.code}</Text>
        
        {/* Priority Badge */}
        <View style={[styles.priorityBadge, { backgroundColor: pColors.bg }]}>
          <View style={[styles.dot, { backgroundColor: pColors.text }]} />
          <Text style={[styles.priorityText, { color: pColors.text }]}>{pLabel}</Text>
        </View>

        {/* Status Badge */}
        <TicketStatusBadge status={ticket.status} />

        <View style={{ flex: 1 }} />

        {/* SLA remaining */}
        {ticket.slaTimer && <SlaCountdown sla={ticket.slaTimer} />}
      </View>

      {/* Title */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{ticket.title}</Text>
      </View>

      {/* Footer Row */}
      <View style={styles.footer}>
        <Text style={styles.subtitle} numberOfLines={1}>
          {CATEGORY_LABEL[ticket.category] ?? ticket.category} · {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
        </Text>
        <View style={styles.technicianWrap}>
          <Ionicons name="person-circle-outline" size={14} color={Colors.textMute} />
          <Text style={styles.technicianText}>{technicianName}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  code: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMute,
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
    color: Colors.text,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMute,
    fontWeight: '600',
  },
  technicianWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  technicianText: {
    fontSize: 11,
    color: Colors.textMute,
    fontWeight: '600',
  },
});
