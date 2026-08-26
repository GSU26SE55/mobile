import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '@/src/lib/theme';
import { NotificationCategoryEnum } from '../enums/notification.enum';
import { useNotificationMatrix } from '../hooks/useNotificationMatrix';
import { NotificationCategoryPreferenceDto } from '../types/notification-matrix.types';

// The 4 channels share a key between the category row and the global toggle ⇒ both can be looked up with 1 key.
type ChannelKey = 'pushEnabled' | 'emailEnabled' | 'smsEnabled' | 'inAppEnabled';

const CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: 'pushEnabled', label: 'Push' },
  { key: 'emailEnabled', label: 'Email' },
  { key: 'smsEnabled', label: 'SMS' },
  { key: 'inAppEnabled', label: 'In-app' },
];

// BE returns English categoryName ("Sla", "Environmental"...) — mapped to a user-facing label here.
// Falls back to categoryName if BE adds a new category before mobile syncs.
const CATEGORY_LABEL: Record<NotificationCategoryEnum, string> = {
  [NotificationCategoryEnum.Ticket]: 'Ticket',
  [NotificationCategoryEnum.Sla]: 'SLA & Escalation',
  [NotificationCategoryEnum.Battery]: 'Battery & Devices',
  [NotificationCategoryEnum.Environmental]: 'Environmental Incidents',
  [NotificationCategoryEnum.Chat]: 'Chat',
  [NotificationCategoryEnum.Account]: 'Account & System',
};

export function CategoryMatrixTable() {
  const { matrix, updateMatrix } = useNotificationMatrix();

  const channels = matrix.data?.channels;
  const categories = matrix.data?.categories ?? [];

  if (matrix.isLoading) {
    return (
      <View style={[styles.card, Shadow, styles.center]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!channels || categories.length === 0) return null;

  // Patch PER ROW: only send the category that changed. Sending all 6 would let two devices open
  // in parallel wipe each other's settings. But within one row, ALL 4 channels must be sent —
  // BE treats a missing field as `false`.
  const toggle = (row: NotificationCategoryPreferenceDto, key: ChannelKey) => {
    updateMatrix.mutate({
      items: [
        {
          category: row.category,
          pushEnabled: row.pushEnabled,
          emailEnabled: row.emailEnabled,
          smsEnabled: row.smsEnabled,
          inAppEnabled: row.inAppEnabled,
          [key]: !row[key],
        },
      ],
    });
  };

  return (
    <View style={[styles.card, Shadow]}>
      <Text style={styles.title}>Per-category Options</Text>
      <Text style={styles.subtitle}>
        The global channel toggle above always wins. Turning off a channel globally disables that column for every category.
      </Text>

      <View style={styles.headerRow}>
        <View style={styles.nameCol} />
        {CHANNELS.map((c) => (
          <Text
            key={c.key}
            style={[styles.headerCell, !channels[c.key] && styles.headerCellOff]}
            numberOfLines={1}
          >
            {c.label}
          </Text>
        ))}
      </View>

      {categories.map((row) => (
        <View key={row.category} style={styles.row}>
          <View style={styles.nameCol}>
            <Text style={styles.rowLabel} numberOfLines={2}>
              {CATEGORY_LABEL[row.category] ?? row.categoryName}
            </Text>
            {!row.isCustomized ? <Text style={styles.inherited}>inherited</Text> : null}
          </View>

          {CHANNELS.map((c) => {
            // A globally disabled channel makes the cell meaningless: lock it instead of letting
            // the user toggle it on and think they'll actually receive it.
            const globalOff = !channels[c.key];
            const on = row[c.key];
            return (
              <Pressable
                key={c.key}
                style={styles.cell}
                disabled={globalOff || updateMatrix.isPending}
                onPress={() => toggle(row, c.key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on, disabled: globalOff }}
                accessibilityLabel={`${CATEGORY_LABEL[row.category] ?? row.categoryName} — ${c.label}`}
              >
                <Ionicons
                  name={on ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={globalOff ? Colors.borderLight : on ? Colors.primary : Colors.textFaint}
                />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  subtitle: { fontSize: 12, color: Colors.textMute, marginBottom: Spacing.md, lineHeight: 17 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerCell: { flex: 1, fontSize: 11, color: Colors.textMute, textAlign: 'center' },
  headerCellOff: { textDecorationLine: 'line-through', color: Colors.textFaint },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  nameCol: { flex: 2, paddingRight: Spacing.sm },
  rowLabel: { fontSize: 13, color: Colors.text },
  inherited: { fontSize: 10, color: Colors.textFaint, marginTop: 2 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs },
});
