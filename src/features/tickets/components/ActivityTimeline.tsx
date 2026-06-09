import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../lib/theme';
import { ActivityActionEnum, TicketActivityDTO } from '../types/ticket.types';

const ACTION_LABEL: Partial<Record<ActivityActionEnum, string>> = {
  Created:            'Ticket duoc tao',
  StatusChanged:      'Trang thai thay doi',
  StaffAssigned:      'Staff duoc gan',
  StaffReassigned:    'Staff duoc dieu chuyen',
  Commented:          'Co binh luan moi',
  SlaPaused:          'SLA tam dung',
  SlaResumed:         'SLA tiep tuc',
  SlaBreached:        'SLA vi pham',
  Escalated:          'Ticket leo thang',
  Resolved:           'Staff bao da xu ly xong',
  Approved:           'Manager phe duyet',
  Rejected:           'Manager tu choi',
  Rated:              'Customer da danh gia',
  Reopened:           'Ticket duoc mo lai',
  AutoClosed:         'Ticket tu dong dong',
  TriageApproved:     'Manager duyet triage',
};

interface Props {
  activities: TicketActivityDTO[];
}

export function ActivityTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return <Text style={styles.empty}>Chua co hoat dong nao.</Text>;
  }

  return (
    <View>
      {activities.map((item, index) => {
        const isLast = index === activities.length - 1;
        const isFirst = index === 0;
        return (
          <View key={item.id} style={styles.item}>
            <View style={styles.dotCol}>
              <View style={[styles.dot, isFirst && styles.dotActive]} />
              {!isLast && <View style={[styles.line, isFirst && styles.lineActive]} />}
            </View>
            <View style={[styles.content, !isLast && styles.contentSpaced]}>
              <Text style={[styles.action, isFirst && styles.actionActive]}>
                {ACTION_LABEL[item.action] ?? item.action}
              </Text>
              {item.actorDisplayName && (
                <Text style={styles.actor}>{item.actorRole} · {item.actorDisplayName}</Text>
              )}
              {item.reason && (
                <Text style={styles.reason}>Ly do: {item.reason}</Text>
              )}
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleString('vi-VN')}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty:          { color: Colors.textMute, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  item:           { flexDirection: 'row', gap: 14 },
  dotCol:         { alignItems: 'center', width: 24 },
  dot:            {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.card2,
    borderWidth: 2, borderColor: Colors.card3,
  },
  dotActive:      {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },
  line:           { flex: 1, width: 2, backgroundColor: Colors.card3, marginTop: 2 },
  lineActive:     { backgroundColor: Colors.primary },
  content:        { flex: 1, paddingTop: 1, gap: 2 },
  contentSpaced:  { paddingBottom: 14 },
  action:         { fontSize: 13, fontWeight: '600', color: Colors.text },
  actionActive:   { fontWeight: '700' },
  actor:          { fontSize: 12, color: Colors.textMute },
  reason:         { fontSize: 12, color: Colors.textMute, fontStyle: 'italic' },
  time:           { fontSize: 11, color: Colors.textFaint, marginTop: 2 },
});
