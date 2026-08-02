import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BadgeColors } from '@/src/lib/theme';
import { TicketStatusEnum } from '../types/ticket.types';

// Nhãn tiếng Việt — khớp nguyên văn web (`shared/components/ticket/TicketStatusBadge`).
// Trước đây mobile để tiếng Anh viết hoa ('APPROVED', 'IN PROGRESS') giữa một
// màn hình toàn tiếng Việt, và 3 trạng thái Waiting gộp chung thành 'WAITING'
// nên khách không biết mình đang chờ gì.
const STATUS_CONFIG: Record<TicketStatusEnum, { label: string; badge: keyof typeof BadgeColors }> = {
  New:                    { label: 'Mới',            badge: 'new' },
  Open:                   { label: 'Chờ triage',     badge: 'open' },
  Assigned:               { label: 'Đã gán',         badge: 'assigned' },
  InProgress:             { label: 'Đang xử lý',     badge: 'progress' },
  WaitingCustomer:        { label: 'Chờ khách hàng', badge: 'waiting' },
  WaitingParts:           { label: 'Chờ linh kiện',  badge: 'waiting' },
  WaitingOnsiteSchedule:  { label: 'Chờ lịch hẹn',   badge: 'waiting' },
  Resolved:               { label: 'Đã xử lý',       badge: 'resolved' },
  Escalated:              { label: 'Đã chuyển cấp',  badge: 'escalated' },
  ClosedPendingRate:      { label: 'Chờ đánh giá',   badge: 'closed' },
  Closed:                 { label: 'Đã đóng',        badge: 'closed' },
  ClosedRejected:         { label: 'Bị từ chối',     badge: 'crit' },
  Incident:               { label: 'Sự cố',          badge: 'crit' },
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
