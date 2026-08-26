import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Colors } from '@/src/lib/theme';
import type { TicketCategoryEnum } from '@/src/shared/enums/ticket.enum';
import { KB_CUSTOMER_CATEGORY_OPTIONS } from '@/src/shared/enums/kb.enum';

interface Props {
  selected: TicketCategoryEnum | null;
  onChange: (category: TicketCategoryEnum | null) => void;
}

export function KbCategoryChips({ selected, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Chip
        label="All"
        active={selected === null}
        onPress={() => onChange(null)}
      />
      {KB_CUSTOMER_CATEGORY_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          icon={opt.icon as keyof typeof Ionicons.glyphMap}
          active={selected === opt.value}
          onPress={() => onChange(selected === opt.value ? null : opt.value)}
        />
      ))}
    </ScrollView>
  );
}

interface ChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}

function Chip({ label, icon, active, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={13}
          color={active ? Colors.white : Colors.text2}
        />
      )}
      <Text
        style={[
          styles.chipText,
          { color: active ? Colors.white : Colors.text2 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
