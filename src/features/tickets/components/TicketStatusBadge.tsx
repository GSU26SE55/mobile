import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TicketStatusEnum } from '../types/ticket.types';

const STATUS_CONFIG: Record<TicketStatusEnum, { label: string; bg: string; color: string }> = {
  New:                    { label: 'Mới',              bg: '#E3F2FD', color: '#1565C0' },
  Open:                   { label: 'Đang chờ',         bg: '#FFF9C4', color: '#F57F17' },
  Approved:               { label: 'Đã duyệt',         bg: '#E8F5E9', color: '#2E7D32' },
  Assigned:               { label: 'Đã gán',           bg: '#F3E5F5', color: '#6A1B9A' },
  InProgress:             { label: 'Đang xử lý',       bg: '#E1F5FE', color: '#0277BD' },
  WaitingCustomer:        { label: 'Chờ phản hồi',     bg: '#FFF3E0', color: '#E65100' },
  WaitingParts:           { label: 'Chờ linh kiện',    bg: '#FFF3E0', color: '#E65100' },
  WaitingOnsiteSchedule:  { label: 'Chờ lịch hẹn',    bg: '#FFF3E0', color: '#E65100' },
  Resolved:               { label: 'Đã giải quyết',   bg: '#E8F5E9', color: '#1B5E20' },
  Escalated:              { label: 'Đã leo thang',     bg: '#FCE4EC', color: '#880E4F' },
  ClosedPendingRate:      { label: 'Chờ đánh giá',     bg: '#E8EAF6', color: '#283593' },
  Closed:                 { label: 'Đã đóng',          bg: '#ECEFF1', color: '#546E7A' },
  ClosedRejected:         { label: 'Bị từ chối',       bg: '#FFEBEE', color: '#B71C1C' },
  Incident:               { label: 'Sự cố',            bg: '#FFEBEE', color: '#C62828' },
};

interface Props {
  status: TicketStatusEnum;
}

export function TicketStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: status, bg: '#F5F5F5', color: '#333' };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
