import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Solar } from '@/src/lib/theme';
import { SiteDto } from '../types/site.types';

export function SiteCard({ item, onPress }: { item: SiteDto; onPress: () => void }) {
  return (
    <Pressable style={[styles.card, Shadow]} onPress={onPress}>
      <View style={styles.iconBg}>
        <Ionicons name="business-outline" size={20} color={Solar.yellowDeep} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {item.address ? (
          <Text style={styles.sub} numberOfLines={1}>{item.address}</Text>
        ) : null}
        <Text style={styles.count}>
          {item.activeBatteryAssetCount}/{item.batteryAssetCount} pin hoạt động
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Solar.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  sub: { fontSize: 11, color: Colors.gray, fontWeight: '500', marginTop: 2 },
  count: { fontSize: 11, color: Colors.textMute, fontWeight: '600', marginTop: 2 },
});
