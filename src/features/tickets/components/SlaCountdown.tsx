import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDateTime } from '@/src/lib/date';
import { Colors } from '@/src/lib/theme';
import { SlaTimerDTO } from '../types/ticket.types';

interface Props {
  sla: SlaTimerDTO;
  /** `compact` cho TicketCard (1 dòng, bar mảnh); mặc định là bản đầy đủ ở màn chi tiết. */
  compact?: boolean;
}

/** Đếm lùi dạng `3h 59m` / `12m 30s` — dưới 1 giờ thì hiện giây để thấy nó đang chạy. */
function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Overdue';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function SlaCountdown({ sla, compact = false }: Props) {
  const isBreached = sla.status === 'Breached';
  const isPaused = sla.status === 'Paused';
  const isMet = sla.status === 'Met';

  // Tick 1s để đồng hồ thực sự đếm lùi. Dừng khi timer không còn chạy — không có lý do
  // để re-render mỗi giây một ticket đã đóng/tạm dừng.
  const isLive = !isMet && !isPaused && !isBreached;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLive]);

  const remainingMs = useMemo(
    () => new Date(sla.dueAt).getTime() - now,
    [sla.dueAt, now],
  );

  // Ưu tiên % tính tại client khi timer đang chạy: remainingPercent từ BE là ảnh chụp
  // lúc query, để yên thì thanh đứng im dù đồng hồ vẫn chạy.
  const percent = useMemo(() => {
    if (isBreached) return 0;
    if (isMet) return 100;
    if (!isLive) return Math.max(0, Math.min(100, sla.remainingPercent));
    const total = new Date(sla.dueAt).getTime() - new Date(sla.startedAt).getTime();
    if (total <= 0) return Math.max(0, Math.min(100, sla.remainingPercent));
    return Math.max(0, Math.min(100, (remainingMs / total) * 100));
  }, [isBreached, isMet, isLive, sla.remainingPercent, sla.dueAt, sla.startedAt, remainingMs]);

  const isUrgent = isBreached || percent <= 15;
  const isTight = !isUrgent && percent <= 40;

  const color = isBreached || isUrgent
    ? Colors.danger
    : isTight
      ? Colors.warning
      : isMet
        ? Colors.success
        : Colors.primaryDark;

  const trackColor = isBreached || isUrgent
    ? Colors.dangerLight
    : isTight
      ? Colors.warningLight
      : Colors.card3;

  const icon: React.ComponentProps<typeof Ionicons>['name'] = isBreached
    ? 'alert-circle'
    : isPaused
      ? 'pause-circle'
      : isMet
        ? 'checkmark-circle'
        : 'time-outline';

  const label = isBreached
    ? 'SLA breached'
    : isPaused
      ? 'SLA paused'
      : isMet
        ? 'Completed on time'
        : formatRemaining(remainingMs);

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        <View style={styles.row}>
          <Ionicons name={icon} size={12} color={color} />
          <Text style={[styles.compactLabel, { color }]}>
            {isLive ? `SLA ${label}` : label}
          </Text>
        </View>
        {!isMet && (
          <View style={[styles.trackThin, { backgroundColor: trackColor }]}>
            <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: color + '33', backgroundColor: color + '0D' }]}>
      <View style={styles.headRow}>
        <View style={styles.row}>
          <Ionicons name={icon} size={15} color={color} />
          <Text style={styles.caption}>
            {isBreached || isPaused || isMet ? 'SLA' : 'Remaining'}
          </Text>
        </View>
        <Text style={[styles.time, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>

      {!isMet && (
        <>
          <View style={[styles.track, { backgroundColor: trackColor }]}>
            <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
          </View>
          <View style={styles.footRow}>
            <Text style={styles.footText}>Due {formatDateTime(sla.dueAt)}</Text>
            <Text style={[styles.footPercent, { color }]}>{Math.round(percent)}%</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  // Bản đầy đủ — màn chi tiết ticket.
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginTop: 10,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caption: { fontSize: 12, fontWeight: '600', color: Colors.textMute },
  time: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  footRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footText: { fontSize: 11, color: Colors.textFaint },
  footPercent: { fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },

  // Bản gọn — dùng trong TicketCard.
  compactWrap: { gap: 4 },
  compactLabel: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  trackThin: { height: 4, borderRadius: 3, overflow: 'hidden' },
});
