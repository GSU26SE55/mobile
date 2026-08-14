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
  // flexShrink: 0 is what keeps the chips whole. ScrollView ships with a base style of
  // flexGrow: 1 / flexShrink: 1, so overriding only flexGrow still leaves this row shrinkable —
  // and once the list below it has rows to render, this row is the one that gives up space and
  // gets its chips clipped. It looked fine on an empty category only because nothing competed.
  //
  // The bottom gap sits here rather than in `row`: a horizontal ScrollView sizes itself from its
  // content and ignores the content container's vertical padding.
  scroll: { flexGrow: 0, flexShrink: 0, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    // Vertical breathing room so the chip's border and shadow are not cut by the scroll bounds.
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Soft yellow fill with a deep-yellow label instead of a saturated #FFD500 pill: the selected
  // chip still reads as selected, but stops being the loudest thing on the screen.
  chipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryDark,
  },
  // An empty category is still tappable (a later page might have items) — just dimmed, not disabled.
  // 0.45 pushed the 12px muted label under a readable contrast ratio on cream.
  chipEmpty: { opacity: 0.6 },
  text: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: Colors.textMute },
  // White on #FFD500 fails contrast badly; the deep yellow reads cleanly on the soft fill.
  textActive: { color: Colors.primaryDark, fontWeight: '800' },
});
