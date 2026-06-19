import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BadgeColors } from '../../../lib/theme';
import { TicketCategoryEnum } from '../../../shared/enums/ticket.enum';
import { KbCategoryIcon, KbCategoryLabel } from '../../../shared/enums/kb.enum';

const BADGE_MAP: Record<TicketCategoryEnum, keyof typeof BadgeColors> = {
  [TicketCategoryEnum.Charging]: 'orange',
  [TicketCategoryEnum.Overheat]: 'crit',
  [TicketCategoryEnum.NoPower]: 'warn',
  [TicketCategoryEnum.Performance]: 'p3',
  [TicketCategoryEnum.Repair]: 'assigned',
  [TicketCategoryEnum.Other]: 'new',
};

interface Props {
  category: TicketCategoryEnum;
  size?: 'sm' | 'md';
}

export function KbCategoryBadge({ category, size = 'sm' }: Props) {
  const colors = BadgeColors[BADGE_MAP[category] ?? 'new'];
  const label = KbCategoryLabel[category] ?? category;
  const icon = (KbCategoryIcon[category] ?? 'help-circle-outline') as keyof typeof Ionicons.glyphMap;
  const isMd = size === 'md';
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: isMd ? 10 : 8,
          paddingVertical: isMd ? 5 : 3,
        },
      ]}
    >
      <Ionicons name={icon} size={isMd ? 13 : 11} color={colors.text} />
      <Text
        style={[
          styles.label,
          { color: colors.text, fontSize: isMd ? 12 : 11 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
    lineHeight: 14,
  },
});
