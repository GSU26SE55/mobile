import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActivityActionEnum, TicketActivityDTO } from '../types/ticket.types';

const ACTION_LABEL: Partial<Record<ActivityActionEnum, string>> = {
  Created:            'Ticket được tạo',
  StatusChanged:      'Trạng thái thay đổi',
  StaffAssigned:      'Staff được gán',
  StaffReassigned:    'Staff được điều chuyển',
  Commented:          'Có bình luận mới',
  SlaPaused:          'SLA tạm dừng',
  SlaResumed:         'SLA tiếp tục',
  SlaBreached:        'SLA vi phạm',
  Escalated:          'Ticket được leo thang',
  Resolved:           'Staff báo đã xử lý xong',
  Approved:           'Manager phê duyệt',
  Rejected:           'Manager từ chối',
  Rated:              'Customer đã đánh giá',
  Reopened:           'Ticket được mở lại',
  AutoClosed:         'Ticket tự động đóng',
  TriageApproved:     'Manager duyệt triage',
};

interface Props {
  activities: TicketActivityDTO[];
}

export function ActivityTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return <Text style={styles.empty}>Chưa có hoạt động nào.</Text>;
  }

  return (
    <View style={styles.container}>
      {activities.map((item, index) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.dotCol}>
            <View style={styles.dot} />
            {index < activities.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.content}>
            <Text style={styles.action}>
              {ACTION_LABEL[item.action] ?? item.action}
            </Text>
            {item.actorDisplayName && (
              <Text style={styles.actor}>{item.actorRole} · {item.actorDisplayName}</Text>
            )}
            {item.reason && (
              <Text style={styles.reason}>Lý do: {item.reason}</Text>
            )}
            <Text style={styles.time}>
              {new Date(item.createdAt).toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  empty:     { color: '#999', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  item:      { flexDirection: 'row', gap: 12 },
  dotCol:    { alignItems: 'center', width: 16 },
  dot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1976D2', marginTop: 4 },
  line:      { flex: 1, width: 2, backgroundColor: '#E0E0E0', marginTop: 2 },
  content:   { flex: 1, paddingBottom: 16, gap: 2 },
  action:    { fontSize: 13, fontWeight: '600', color: '#111' },
  actor:     { fontSize: 12, color: '#666' },
  reason:    { fontSize: 12, color: '#888', fontStyle: 'italic' },
  time:      { fontSize: 11, color: '#AAA', marginTop: 2 },
});
