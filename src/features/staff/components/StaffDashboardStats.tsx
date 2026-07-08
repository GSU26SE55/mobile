import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../../lib/theme';
import { useStaffDashboardStats } from '../hooks/useStaffDashboardStats';
import type { StaffTicketDashboardStatsDto } from '../types/staff.types';

// GH-67 — KPI dashboard Staff. Chart thuần react-native-svg (KHÔNG victory-native).
// Đặt TRÊN filterRow của dashboard.tsx (không ListHeaderComponent) → luôn hiện, độc lập list.

// ── Chart primitives ──────────────────────────────────────────────────────

interface Segment {
  value: number;
  color: string;
  label: string;
}

/** Donut vẽ bằng Circle strokeDasharray — segment nối tiếp theo offset lũy kế. */
function Donut({ segments, size = 120, stroke = 16 }: { segments: Segment[]; size?: number; stroke?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  let offset = 0;
  return (
    <Svg width={size} height={size}>
      {/* nền */}
      <Circle cx={cx} cy={cx} r={r} stroke={Colors.card3} strokeWidth={stroke} fill="none" />
      {total > 0 &&
        segments.map((seg, i) => {
          if (seg.value <= 0) return null;
          const len = (seg.value / total) * c;
          const el = (
            <Circle
              key={i}
              cx={cx}
              cy={cx}
              r={r}
              stroke={seg.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              // xoay -90° để bắt đầu từ đỉnh
              transform={`rotate(-90 ${cx} ${cx})`}
            />
          );
          offset += len;
          return el;
        })}
      <SvgText x={cx} y={cx - 2} fontSize={22} fontWeight="800" fill={Colors.text} textAnchor="middle">
        {total}
      </SvgText>
      <SvgText x={cx} y={cx + 16} fontSize={10} fill={Colors.textMute} textAnchor="middle">
        ticket
      </SvgText>
    </Svg>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Gauge bán nguyệt (180°) cho SLA compliancePercent. */
function Gauge({ percent, size = 160, stroke = 14 }: { percent: number; size?: number; stroke?: number }) {
  const p = Math.max(0, Math.min(100, percent));
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;
  const arc = (from: number, to: number) => {
    const a = polar(cx, cy, r, from);
    const b = polar(cx, cy, r, to);
    const large = to - from <= 180 ? 0 : 1;
    return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
  };
  const color = p >= 90 ? Colors.success : p >= 70 ? Colors.warning : Colors.danger;
  return (
    <Svg width={size} height={size / 2 + stroke}>
      <Path d={arc(0, 180)} stroke={Colors.card3} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      <Path d={arc(0, (p / 100) * 180)} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      <SvgText x={cx} y={cy - 4} fontSize={26} fontWeight="800" fill={Colors.text} textAnchor="middle">
        {Math.round(p)}%
      </SvgText>
    </Svg>
  );
}

/** Bar chart 7 ngày. */
function Bars({ data, width = 300, height = 90 }: { data: { date: string; count: number }[]; width?: number; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const n = data.length || 1;
  const gap = 10;
  const bw = (width - gap * (n - 1)) / n;
  const barMax = height - 18;
  return (
    <Svg width={width} height={height}>
      {data.map((d, i) => {
        const h = (d.count / max) * barMax;
        const x = i * (bw + gap);
        const y = barMax - h;
        const dow = new Date(d.date).getDate();
        return (
          <G key={d.date}>
            <Rect x={x} y={y} width={bw} height={Math.max(2, h)} rx={4} fill={Colors.primary} opacity={0.9} />
            {d.count > 0 && (
              <SvgText x={x + bw / 2} y={y - 3} fontSize={9} fill={Colors.textMute} textAnchor="middle">
                {d.count}
              </SvgText>
            )}
            <SvgText x={x + bw / 2} y={height - 3} fontSize={9} fill={Colors.textFaint} textAnchor="middle">
              {dow}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ── Status → màu (từ palette theme) ───────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  New: Colors.stNew, Open: Colors.stOpen, Approved: Colors.stOpen,
  Assigned: Colors.stAssigned, InProgress: Colors.stProgress,
  WaitingCustomer: Colors.stWaiting, WaitingParts: Colors.stWaiting, WaitingOnsiteSchedule: Colors.stWaiting,
  Resolved: Colors.stResolved, Escalated: Colors.stEscalated,
  ClosedPendingRate: Colors.stClosed, Closed: Colors.stClosed,
  ClosedRejected: Colors.danger, Incident: Colors.danger,
};
const STATUS_LABEL: Record<string, string> = {
  New: 'Mới', Open: 'Mở', Approved: 'Duyệt', Assigned: 'Được gán', InProgress: 'Đang xử lý',
  WaitingCustomer: 'Chờ KH', WaitingParts: 'Chờ linh kiện', WaitingOnsiteSchedule: 'Chờ lịch',
  Resolved: 'Đã giải quyết', Escalated: 'Leo thang', ClosedPendingRate: 'Chờ đánh giá',
  Closed: 'Đóng', ClosedRejected: 'Từ chối', Incident: 'Sự cố',
};

// ── KPI card + legend ─────────────────────────────────────────────────────
function Kpi({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function Legend({ items }: { items: Segment[] }) {
  return (
    <View style={styles.legend}>
      {items.filter((i) => i.value > 0).map((i) => (
        <View key={i.label} style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: i.color }]} />
          <Text style={styles.legendText} numberOfLines={1}>{i.label} ({i.value})</Text>
        </View>
      ))}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
function buildStatusSegments(countByStatus: Record<string, number>): Segment[] {
  return Object.entries(countByStatus)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ value: v, color: STATUS_COLOR[k] ?? Colors.gray, label: STATUS_LABEL[k] ?? k }));
}

function Content({ data }: { data: StaffTicketDashboardStatsDto }) {
  const statusSegs = buildStatusSegments(data.countByStatus);
  const riskSegs: Segment[] = [
    { value: data.slaRisk.healthy, color: Colors.success, label: 'An toàn' },
    { value: data.slaRisk.near, color: Colors.warning, label: 'Sắp breach' },
    { value: data.slaRisk.breached, color: Colors.danger, label: 'Đã breach' },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.kpiRow}>
        <Kpi value={data.openCount} label="Đang phụ trách" color={Colors.primaryDark} />
        <Kpi value={data.resolvedCount} label="Đã xử lý" color={Colors.success} />
        <Kpi value={data.nearBreachCount} label="Sắp breach" color={Colors.warning} />
        <Kpi value={data.breachedCount} label="Quá hạn" color={Colors.danger} />
      </View>

      <View style={styles.chartRow}>
        <View style={styles.chartCol}>
          <Text style={styles.chartTitle}>Tuân thủ SLA</Text>
          <Gauge percent={data.sla.compliancePercent} />
          <Text style={styles.chartSub}>
            {data.sla.met} met · {data.sla.breached} breach · {data.sla.running} chạy
          </Text>
        </View>
        <View style={styles.chartCol}>
          <Text style={styles.chartTitle}>Rủi ro SLA</Text>
          <Donut segments={riskSegs} />
          <Legend items={riskSegs} />
        </View>
      </View>

      {statusSegs.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.chartTitle}>Phân bố trạng thái</Text>
          <View style={styles.chartRow}>
            <Donut segments={statusSegs} size={110} stroke={14} />
            <View style={styles.flex1}>
              <Legend items={statusSegs} />
            </View>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.chartTitle}>Ticket được gán · 7 ngày</Text>
        <Bars data={data.createdTrend7Days} />
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
  chartRow: { flexDirection: 'row', gap: 12 },
  chartCol: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  chartTitle: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  chartSub: { fontSize: 10, color: Colors.textMute, marginTop: 6, textAlign: 'center' },
  legend: { gap: 4, marginTop: 8, alignSelf: 'stretch' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.text2, flex: 1 },
  flex1: { flex: 1 },
});
