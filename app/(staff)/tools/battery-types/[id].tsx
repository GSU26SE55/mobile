import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '@/src/lib/theme';
import { useBatteryTypeDetail } from '@/src/features/battery-types/hooks/useBatteryTypeDetail';
import {
  BatteryChemistryEnum,
  BATTERY_CHEMISTRY_LABEL,
} from '@/src/features/battery-types/enums/battery-type.enum';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function BatteryTypeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useBatteryTypeDetail(id ?? '');

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>Chi tiết loại pin</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError || !data ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.textMute} />
          <Text style={styles.emptyText}>Không tải được chi tiết.</Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, Shadow]}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.name}>{data.name}</Text>
          <View style={[styles.card, Shadow]}>
            <Row label="Nhà sản xuất" value={data.manufacturer ?? '—'} />
            <Row
              label="Hoá học"
              value={BATTERY_CHEMISTRY_LABEL[data.chemistry as BatteryChemistryEnum] ?? '—'}
            />
            <Row label="Dung lượng danh định" value={`${data.nominalCapacityAh} Ah`} />
            <Row label="Điện áp danh định" value={`${data.nominalVoltage} V`} />
            <Row label="Chu kỳ tối đa" value={`${data.maxCycleCount}`} />
          </View>
          {data.description ? (
            <View style={[styles.card, Shadow]}>
              <Text style={styles.descLabel}>Mô tả</Text>
              <Text style={styles.descText}>{data.description}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  content: { padding: 16 },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  infoLabel: { fontSize: 13, color: Colors.textMute },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  descLabel: { fontSize: 13, color: Colors.textMute, marginBottom: 6 },
  descText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMute },
  retryBtn: { backgroundColor: Colors.card, borderRadius: Radius.sm, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
