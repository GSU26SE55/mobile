import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../lib/theme';
import { TicketActivityDTO } from '../types/ticket.types';
import { getActivityMeta, activityToneStyle } from '../utils/activityMeta';

interface Props {
  activities: TicketActivityDTO[];
}

export function ActivityTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return <Text style={styles.empty}>Chưa có hoạt động nào.</Text>;
  }

  return (
    <View>
      {activities.map((item, index) => {
        const isLast = index === activities.length - 1;
        const meta = getActivityMeta(item.action);
        const style = activityToneStyle(meta.tone);
        return (
          <View key={item.id ?? `activity-${index}`} style={styles.item}>
            <View style={styles.dotCol}>
              <View style={[styles.dot, { backgroundColor: style.bg }]}>
                <Ionicons name={meta.icon} size={13} color={style.iconColor} />
              </View>
              {!isLast && <View style={styles.line} />}
            </View>
            <View style={[styles.content, !isLast && styles.contentSpaced]}>
              <Text style={[styles.action, { color: style.dot }]}>{meta.label}</Text>
              {item.actorDisplayName && (
                <Text style={styles.actor}>{item.actorRole} · {item.actorDisplayName}</Text>
              )}
              {(item.oldValue || item.newValue) && (
                <Text style={styles.value}>
                  {item.oldValue ? `${item.oldValue} → ${item.newValue ?? ''}` : item.newValue}
                </Text>
              )}
              {item.reason && (
                <Text style={styles.reason}>Lý do: {item.reason}</Text>
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
  dotCol:         { alignItems: 'center', width: 26 },
  dot:            {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  line:           { flex: 1, width: 2, backgroundColor: Colors.card3, marginTop: 2 },
  content:        { flex: 1, paddingTop: 2, gap: 2 },
  contentSpaced:  { paddingBottom: 14 },
  action:         { fontSize: 13, fontWeight: '700' },
  actor:          { fontSize: 12, color: Colors.textMute },
  value:          { fontSize: 12, color: Colors.textMute },
  reason:         { fontSize: 12, color: Colors.textMute, fontStyle: 'italic' },
  time:           { fontSize: 11, color: Colors.textFaint, marginTop: 2 },
});
