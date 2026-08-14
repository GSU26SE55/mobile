import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateTime } from '@/src/lib/date';
import { Colors } from '@/src/lib/theme';
import { TicketActivityDTO, TicketAssignmentDTO } from '../types/ticket.types';
import { getActivityMeta, activityToneStyle } from '../utils/activityMeta';
import { statusLabel } from './TicketStatusBadge';

interface Props {
  activities?: TicketActivityDTO[];
  assignments?: TicketAssignmentDTO[] | null;
  isLoading?: boolean;
}

const IS_GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function renderActivityValue(
  item: TicketActivityDTO,
  assignments?: TicketAssignmentDTO[] | null,
): string | null {
  if (!item.newValue) return null;
  const val = item.newValue.trim();
  if (!val) return null;

  if (item.action === 'StatusChanged') {
    if (val === 'Resolved' || val === 'Completed') {
      return 'Completed';
    }
    const label = statusLabel(val);
    return label === 'Resolved' ? 'Completed' : label;
  }

  // Handle staff assignment or any raw GUID value
  if (item.action === 'StaffAssigned' || item.action === 'StaffReassigned' || IS_GUID.test(val)) {
    if (IS_GUID.test(val)) {
      const matched = assignments?.find((a) => a.staffId === val);
      if (matched?.staffName) {
        return matched.staffName;
      }
      // Hide raw GUID if staff name is unavailable
      return null;
    }
  }

  if (val === 'Resolved') {
    return 'Completed';
  }

  return val;
}

export function ActivityTimeline({ activities, assignments, isLoading }: Props) {
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
    return <Text style={styles.empty}>No activity yet.</Text>;
  }

  return (
    <View>
      {activities.map((item, index) => {
        const isLast = index === activities.length - 1;
        const meta = getActivityMeta(item.action);
        const style = activityToneStyle(meta.tone);
        const displayValue = renderActivityValue(item, assignments);

        // Sanitize actor display name if it happens to be a GUID
        const actorName = item.actorDisplayName && !IS_GUID.test(item.actorDisplayName)
          ? item.actorDisplayName
          : null;

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
                <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
              </View>
              {(actorName || item.actorRole) && (
                <Text style={styles.actor}>
                  {actorName ? `${actorName} · ${item.actorRole}` : item.actorRole}
                </Text>
              )}
              {!!displayValue && (
                <Text style={styles.value}>{displayValue}</Text>
              )}
              {item.reason && (
                <Text style={styles.reason}>Reason: {item.reason}</Text>
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
