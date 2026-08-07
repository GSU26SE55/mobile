import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/lib/theme';
import { TicketActivityDTO } from '../types/ticket.types';
import { getActivityMeta, activityToneStyle } from '../utils/activityMeta';
import { statusLabel } from './TicketStatusBadge';

interface Props {
  activities?: TicketActivityDTO[];
  isLoading?: boolean;
}

// Format dd/MM/yyyy HH:mm — khớp frontend (date-fns "dd/MM/yyyy HH:mm").
// Tự viết để không thêm package date-fns vào mobile.
function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function ActivityTimeline({ activities, isLoading }: Props) {
  if (isLoading) {
    return (
      <View>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.skeleton} />
        ))}
      </View>
    );
  }

  if (!activities?.length) {
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
              <View style={styles.headerRow}>
                <Text style={[styles.action, { color: style.dot }]} numberOfLines={1}>
                  {meta.label}
                </Text>
                <Text style={styles.time}>{formatActivityTime(item.createdAt)}</Text>
              </View>
              {item.actorDisplayName && (
                <Text style={styles.actor}>{item.actorDisplayName} · {item.actorRole}</Text>
              )}
              {/* Chỉ hiện giá trị MỚI. Trước đây in kèm oldValue gạch ngang
                  ("Assigned InProgress") — rối mắt mà không thêm thông tin gì,
                  trạng thái cũ đã nằm ở dòng activity ngay phía trên rồi. */}
              {!!item.newValue && (
                <Text style={styles.value}>
                  {/* newValue tuỳ action mà là status / priority / tên nhân viên
                      → chỉ dịch sang tiếng Việt khi chắc chắn nó là status. */}
                  {item.action === 'StatusChanged' ? statusLabel(item.newValue) : item.newValue}
                </Text>
              )}
              {item.reason && (
                <Text style={styles.reason}>Lý do: {item.reason}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty:          { color: Colors.textMute, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  skeleton:       { height: 56, borderRadius: 8, backgroundColor: Colors.card3, marginBottom: 12 },
  item:           { flexDirection: 'row', gap: 14 },
  dotCol:         { alignItems: 'center', width: 26 },
  dot:            {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  line:           { flex: 1, width: 2, backgroundColor: Colors.card3, marginTop: 2 },
  content:        { flex: 1, paddingTop: 2, gap: 2 },
  contentSpaced:  { paddingBottom: 14 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  action:         { flex: 1, fontSize: 13, fontWeight: '700' },
  actor:          { fontSize: 12, color: Colors.textMute },
  value:          { fontSize: 12, color: Colors.textMute },
  reason:         { fontSize: 12, color: Colors.textMute, fontStyle: 'italic' },
  time:           { fontSize: 11, color: Colors.textFaint },
});
