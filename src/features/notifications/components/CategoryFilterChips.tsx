import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { NotificationCategoryEnum } from '../enums/notification.enum';

// `null` = "All" (no filter). Use null instead of a fake enum value to avoid colliding with the BE value range.
export type CategoryFilter = NotificationCategoryEnum | null;

// Display order = BE enum value order, kept as-is to match the category settings screen.
const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: null, label: 'All' },
  { key: NotificationCategoryEnum.Ticket, label: 'Ticket' },
  { key: NotificationCategoryEnum.Sla, label: 'SLA' },
  { key: NotificationCategoryEnum.Battery, label: 'Battery' },
  { key: NotificationCategoryEnum.Environmental, label: 'Environmental' },
  { key: NotificationCategoryEnum.Chat, label: 'Chat' },
  { key: NotificationCategoryEnum.Account, label: 'Account' },
];

interface Props {
  value: CategoryFilter;
  onChange: (next: CategoryFilter) => void;
  /** Row count per category among loaded items — a category with zero rows still shows, just dimmed. */
  counts: Record<string, number>;
  total: number;
}

export function CategoryFilterChips({ value, onChange, counts, total }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {CATEGORY_TABS.map((tab) => {
        const count = tab.key === null ? total : (counts[String(tab.key)] ?? 0);
        const active = value === tab.key;
        return (
          <Pressable
            key={String(tab.key)}
            style={[styles.chip, active && styles.chipActive, !active && count === 0 && styles.chipEmpty]}
            onPress={() => onChange(tab.key)}
          >
            <Text
              style={[styles.text, active && styles.textActive]}
              numberOfLines={1}
            >
              {tab.label} ({count})
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // No negative marginHorizontal here — the component sits inside the parent screen's padded area;
  // left/right padding comes from `row` so chips scroll edge-to-edge while still having breathing room at both ends.
  scroll: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  // An empty category is still tappable (a later page might have items) — just dimmed, not disabled.
  chipEmpty: { opacity: 0.45 },
  text: { fontSize: 12, fontWeight: '600', color: Colors.textMute },
  textActive: { color: '#FFFFFF', fontWeight: '800' },
});
