import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '@/src/lib/date';
import { Colors, Solar } from '@/src/lib/theme';
import { BatteryAssetDto } from '../types/battery.types';
import { MaintenanceCycleDto } from '../types/maintenance-cycle.types';
import { useMaintenanceCycles } from '../hooks/useMaintenanceCycles';
import { GlassSurface } from './EnergyBackdrop';

interface Props {
  battery: BatteryAssetDto;
}

/** Số ngày còn lại tới kỳ tới; âm nghĩa là đã quá hạn. */
function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, warn && styles.statWarn]}>{value}</Text>
    </View>
  );
}

/** Tình trạng pin trong kỳ — chỉ những chỉ số BE thực sự chụp được. */
function CycleDetail({ cycle }: { cycle: MaintenanceCycleDto }) {
  // readingCount = 0 nghĩa là pin mất kết nối suốt kỳ, khác hẳn với "chưa chụp".
  // Kỳ ghi trước khi tính năng này có thì readingCount là null.
  if (cycle.readingCount == null) {
    return <Text style={styles.empty}>No readings were captured for this cycle.</Text>;
  }
  if (cycle.readingCount === 0) {
    return (
      <Text style={styles.empty}>
        The battery reported no sensor data during this cycle.
      </Text>
    );
  }

  const temp =
    cycle.avgTemperatureCelsius != null
      ? `${cycle.avgTemperatureCelsius}°C avg · ${cycle.maxTemperatureCelsius}°C peak`
      : '—';
  const voltage =
    cycle.minVoltage != null ? `${cycle.minVoltage}V – ${cycle.maxVoltage}V` : '—';
  const alerts =
    cycle.alertCount == null
      ? '—'
      : cycle.criticalAlertCount
        ? `${cycle.alertCount} (${cycle.criticalAlertCount} critical)`
        : `${cycle.alertCount}`;

  return (
    <View style={styles.detail}>
      <Stat label="Temperature" value={temp} />
      <Stat label="Voltage range" value={voltage} />
      <Stat
        label="Charge cycles"
        value={cycle.cycleCountDelta != null ? `+${cycle.cycleCountDelta}` : '—'}
      />
      <Stat label="Alerts" value={alerts} warn={!!cycle.criticalAlertCount} />
    </View>
  );
}

function CycleRow({
  cycle,
  previousSoh,
}: {
  cycle: MaintenanceCycleDto;
  previousSoh?: number | null;
}) {
  const [open, setOpen] = useState(false);

  // Làm tròn TRƯỚC khi so sánh: hiệu hai số bằng nhau có thể ra -0 trong dấu phẩy động,
  // và (-0).toFixed(1) in ra "-0.0" — một mức sụt giả không hề tồn tại.
  const raw =
    previousSoh == null || cycle.sohPercentAtCycle == null
      ? null
      : cycle.sohPercentAtCycle - previousSoh;
  const delta = raw === null ? null : Math.round(raw * 10) / 10;
  const changed = delta !== null && delta !== 0;

  return (
    <View style={styles.cycle}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.cycleHead}
      >
        <Ionicons
          name={open ? 'chevron-down' : 'chevron-forward'}
          size={14}
          color={Solar.mute}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cycle.cycleNo}</Text>
        </View>
        <Text style={styles.cycleDate}>{formatDate(cycle.dueAtUtc)}</Text>
        <View style={styles.sohWrap}>
          <Text style={styles.soh}>
            {cycle.sohPercentAtCycle != null ? `${cycle.sohPercentAtCycle}%` : '—'}
          </Text>
          {changed && (
            <Text style={[styles.delta, delta < 0 && styles.deltaDown]}>
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)}
            </Text>
          )}
        </View>
      </Pressable>
      {open && <CycleDetail cycle={cycle} />}
    </View>
  );
}

/**
 * Nhật ký bảo trì định kỳ của pin — pin đã qua những mốc nào, và sức khoẻ thay đổi ra sao
 * qua từng kỳ. Mốc do hệ thống tự ghi khi đến hạn; không gắn với ticket.
 */
export function MaintenanceHistoryCard({ battery }: Props) {
  const { data: cycles = [], isLoading } = useMaintenanceCycles(battery.id);

  // Kỳ tới đọc thẳng từ asset, không suy ra từ danh sách kỳ.
  const days = battery.nextMaintenanceDueAtUtc
    ? daysUntil(battery.nextMaintenanceDueAtUtc)
    : null;

  return (
    <GlassSurface style={styles.card}>
      <Text style={styles.title}>Maintenance</Text>

      {days !== null && (
        <View style={styles.summary}>
          <Stat
            label="Last checkpoint"
            value={
              battery.lastMaintenanceAtUtc
                ? formatDate(battery.lastMaintenanceAtUtc)
                : 'None yet'
            }
          />
          <Stat label="Next due" value={formatDate(battery.nextMaintenanceDueAtUtc)} />
          <Stat
            label={days < 0 ? 'Overdue' : 'Due in'}
            value={days < 0 ? `${Math.abs(days)}d` : `${days}d`}
            warn={days < 0}
          />
        </View>
      )}

      {isLoading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : cycles.length === 0 ? (
        <Text style={styles.empty}>
          No maintenance checkpoint recorded yet. The first one is recorded automatically
          when the cycle comes due.
        </Text>
      ) : (
        cycles.map((cycle, i) => (
          <CycleRow
            key={cycle.id}
            cycle={cycle}
            // Danh sách xếp kỳ mới nhất trước, nên kỳ liền trước nằm ở index sau.
            previousSoh={cycles[i + 1]?.sohPercentAtCycle}
          />
        ))
      )}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 18, paddingVertical: 16, marginBottom: 16 },
  title: {
    color: Solar.ink,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  summary: {
    flexDirection: 'row',
    gap: 20,
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Solar.border,
  },
  cycle: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Solar.border,
  },
  cycleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Solar.tile,
  },
  badgeText: { color: Solar.ink, fontSize: 12, fontWeight: '700' },
  cycleDate: { color: Solar.ink, fontSize: 13 },
  sohWrap: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  soh: { color: Solar.ink, fontSize: 15, fontWeight: '700' },
  delta: { color: Solar.mute, fontSize: 11 },
  deltaDown: { color: Colors.danger },
  detail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 14,
  },
  stat: { minWidth: 96 },
  statLabel: {
    color: Solar.mute,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: { color: Solar.ink, fontSize: 13 },
  statWarn: { color: Colors.danger },
  empty: {
    color: Solar.mute,
    fontSize: 12,
    paddingVertical: 12,
    lineHeight: 18,
  },
});
