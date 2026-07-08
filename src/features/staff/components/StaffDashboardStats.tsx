import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../lib/theme';
import { useStaffDashboardStats } from '../hooks/useStaffDashboardStats';
import type { StaffTicketDashboardStatsDto } from '../types/staff.types';

// GH-67 — KPI dashboard Staff (đã tối giản: KPI + thanh Tuân thủ SLA).
// Đặt TRÊN filterRow của dashboard.tsx → luôn hiện, độc lập list ticket bên dưới.

function Kpi({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function SlaChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.slaChip}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.slaChipVal}>{value}</Text>
      <Text style={styles.slaChipLabel}>{label}</Text>
    </View>
  );
}

function Content({ data }: { data: StaffTicketDashboardStatsDto }) {
  const pct = Math.max(0, Math.min(100, data.sla.compliancePercent));
  const slaColor = pct >= 90 ? Colors.success : pct >= 70 ? Colors.warning : Colors.danger;

  return (
    <View style={styles.wrap}>
      <View style={styles.kpiRow}>
        <Kpi value={data.openCount} label="Đang phụ trách" color={Colors.primaryDark} />
        <Kpi value={data.resolvedCount} label="Đã xử lý" color={Colors.success} />
        <Kpi value={data.nearBreachCount} label="Sắp breach" color={Colors.warning} />
        <Kpi value={data.breachedCount} label="Quá hạn" color={Colors.danger} />
      </View>

      {/* Tuân thủ SLA — thanh ngang gọn (đã bỏ gauge + donut Rủi ro + Phân bố trạng thái vì
          trùng KPI Sắp breach/Quá hạn và tab list bên dưới). */}
      <View style={styles.card}>
        <View style={styles.slaTop}>
          <Text style={styles.chartTitle}>Tuân thủ SLA</Text>
          <Text style={[styles.slaPct, { color: slaColor }]}>{Math.round(pct)}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: slaColor }]} />
        </View>
        <View style={styles.slaChips}>
          <SlaChip color={Colors.success} label="đúng hạn" value={data.sla.met} />
          <SlaChip color={Colors.danger} label="breach" value={data.sla.breached} />
          <SlaChip color={Colors.textMute} label="đang chạy" value={data.sla.running} />
        </View>
      </View>
    </View>
  );
}

export function StaffDashboardStats() {
  const { data, isLoading, isError } = useStaffDashboardStats();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }
  // Lỗi/null → ẩn hẳn KPI, không chặn list ticket bên dưới (query tách biệt).
  if (isError || !data) return null;

  return <Content data={data} />;
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  loading: { paddingVertical: 24, alignItems: 'center' },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpiCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiLabel: { fontSize: 10, color: Colors.textMute, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  chartTitle: { fontSize: 12, fontWeight: '700', color: Colors.text },
  slaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  slaPct: { fontSize: 24, fontWeight: '800' },
  track: { height: 10, borderRadius: 999, backgroundColor: Colors.card3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  slaChips: { flexDirection: 'row', gap: 14, marginTop: 12 },
  slaChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  slaChipVal: { fontSize: 12, fontWeight: '800', color: Colors.text },
  slaChipLabel: { fontSize: 11, color: Colors.textMute },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
