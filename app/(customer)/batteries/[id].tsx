import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../../../src/lib/theme';
import { useMyBatteryAssets } from '../../../src/features/batteries/hooks/useMyBatteryAssets';
import { BatteryAssetDto } from '../../../src/features/batteries/types/battery.types';

const BATTERY_STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Active', color: '#10B981', bg: '#E8F8EE' },
  2: { label: 'Inactive', color: Colors.gray, bg: '#F3F4F6' },
  3: { label: 'Failed', color: Colors.danger, bg: '#FFEBEA' },
};

export default function BatteryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: batteries = [], isLoading } = useMyBatteryAssets();

  const battery = batteries.find((b: BatteryAssetDto) => b.id === id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!battery) {
    return (
      <View style={styles.center}>
        <Ionicons name="battery-dead-outline" size={40} color={Colors.gray} />
        <Text style={styles.notFoundTitle}>Device not found</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const statusInfo = BATTERY_STATUS_MAP[battery.status] ?? { label: 'Unknown', color: Colors.gray, bg: '#F3F4F6' };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>Device Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, Shadow]}>
          <View style={[styles.batteryIconBg, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name="battery-charging" size={28} color={statusInfo.color} />
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusInfo.bg }]}>
            <View style={[styles.dot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          <Text style={styles.deviceName}>{battery.batteryTypeName}</Text>
          <Text style={styles.deviceSerial}>{battery.serialNumber}</Text>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, Shadow]}>
          <InfoRow icon="barcode-outline" label="Serial Number" value={battery.serialNumber} />
          <View style={styles.separator} />
          <InfoRow icon="cube-outline" label="Type" value={battery.batteryTypeName} />
          <View style={styles.separator} />
          <InfoRow icon="location-outline" label="Site" value={battery.siteName ?? 'Not assigned'} />
          <View style={styles.separator} />
          <InfoRow
            icon="pulse-outline"
            label="Status"
            value={statusInfo.label}
            valueColor={statusInfo.color}
          />
        </View>

        {/* Create ticket CTA */}
        <Pressable
          style={[styles.ctaCard, Shadow]}
          onPress={() => router.push({
            pathname: '/(customer)/tickets/create',
            params: { batteryId: battery.id },
          })}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.ctaText}>Create support ticket for this device</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={Colors.textMute} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, gap: 10 },
  notFoundTitle: { fontSize: 16, fontWeight: '800', color: Colors.accent, marginTop: 8 },
  goBackBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  goBackText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.accent },

  scroll: { padding: 20, paddingBottom: 60 },

  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  batteryIconBg: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '800' },
  deviceName: { fontSize: 20, fontWeight: '800', color: Colors.accent, textAlign: 'center' },
  deviceSerial: { fontSize: 13, color: Colors.gray, fontWeight: '600', marginTop: 4 },

  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, color: Colors.textMute, fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '800', color: Colors.accent, marginTop: 2 },
  separator: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)' },

  ctaCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctaText: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text },
});
