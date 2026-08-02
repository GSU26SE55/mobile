import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '@/src/lib/theme';
import { BatteryTypeDto } from '../types/battery-type.types';
import {
  BatteryChemistryEnum,
  BATTERY_CHEMISTRY_LABEL,
} from '../enums/battery-type.enum';

export function BatteryTypeCard({
  item,
  onPress,
}: {
  item: BatteryTypeDto;
  onPress: () => void;
}) {
  const chemistry =
    BATTERY_CHEMISTRY_LABEL[item.chemistry as BatteryChemistryEnum] ?? '—';
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{chemistry}</Text>
        </View>
      </View>
      <Text style={styles.sub} numberOfLines={1}>
        {item.manufacturer ?? 'Chưa rõ NSX'}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{item.nominalCapacityAh} Ah</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>{item.nominalVoltage} V</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>{item.maxCycleCount} chu kỳ</Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={Colors.textMute}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    ...Shadow,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text, marginRight: 8 },
  badge: {
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  sub: { fontSize: 13, color: Colors.textMute, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  meta: { fontSize: 12, color: Colors.text },
  dot: { fontSize: 12, color: Colors.textMute, marginHorizontal: 6 },
  chevron: { marginLeft: 'auto' },
});
