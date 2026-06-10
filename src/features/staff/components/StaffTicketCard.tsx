import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BadgeColors, Colors, Shadow } from '../../../lib/theme';
import { TicketDTO } from '../../tickets/types/ticket.types';
import { SlaCountdown } from '../../tickets/components/SlaCountdown';
import { TicketStatusBadge } from '../../tickets/components/TicketStatusBadge';

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

const STATUS_HINT: Record<string, string> = {
  Assigned: 'Nhấn để bắt đầu xử lý',
  InProgress: 'Đang xử lý',
  WaitingCustomer: 'Chờ khách phản hồi',
  WaitingParts: 'Chờ linh kiện',
  WaitingOnsiteSchedule: 'Chờ lịch on-site',
  Resolved: 'Đã xử lý — chờ duyệt',
  Escalated: 'Đã escalate',
};

interface Props {
  ticket: TicketDTO;
  onPress: () => void;
}

export function StaffTicketCard({ ticket, onPress }: Props) {
  const pKey = PRIORITY_BADGE[ticket.priority] ?? 'p3';
  const pColors = BadgeColors[pKey];
  const pLabel = PRIORITY_LABEL[ticket.priority] ?? ticket.priority;
  const hint = STATUS_HINT[ticket.status] ?? '';

  return (
    <Pressable style={[styles.card, Shadow]} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.code}>{ticket.code}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: pColors.bg }]}>
          <View style={[styles.dot, { backgroundColor: pColors.text }]} />
          <Text style={[styles.priorityText, { color: pColors.text }]}>{pLabel}</Text>
        </View>
        <TicketStatusBadge status={ticket.status} />
        <View style={{ flex: 1 }} />
        {ticket.slaTimer && <SlaCountdown sla={ticket.slaTimer} />}
      </View>

      <Text style={styles.title} numberOfLines={2}>{ticket.title}</Text>

      {hint ? (
        <View style={styles.hintRow}>
          <Ionicons name="arrow-forward-circle-outline" size={14} color={Colors.primary} />
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.subtitle} numberOfLines={1}>
          {CATEGORY_LABEL[ticket.category] ?? ticket.category} · {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
        </Text>
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
    gap: 10,
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
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 20,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMute,
    fontWeight: '600',
  },
});
