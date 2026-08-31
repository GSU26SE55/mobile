import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDateTime } from '@/src/lib/date';
import { BadgeColors, Colors } from '@/src/lib/theme';
import { SlaTimerDTO } from '../types/ticket.types';

interface Props {
  sla: SlaTimerDTO;
  /** `compact` cho TicketCard (1 dòng, bar mảnh); mặc định là bản đầy đủ ở màn chi tiết. */
  compact?: boolean;
}

/**
 * How far PAST due. Breach is an exception state, so the row says how bad it is
 * — "3d overdue" and "20m overdue" need different reactions from a technician.
 */
function formatOverdue(ms: number): string {
  const over = Math.abs(ms);
  const d = Math.floor(over / 86_400_000);
  const h = Math.floor(over / 3_600_000);
  const m = Math.floor((over % 3_600_000) / 60_000);
  if (d > 0) return `${d}d overdue`;
  if (h > 0) return `${h}h overdue`;
  return `${m}m overdue`;
}

/**
 * Đếm lùi dạng `13d 23h` / `3h 59m` / `12m 30s` — càng gần hết hạn càng mịn.
 * Tách ngày ra vì SLA dài ngày dồn hết vào giờ thì đọc ra `335h 57m`, không ai
 * quy ra được là gần hai tuần. Dưới 1 giờ hiện giây để thấy nó đang chạy.
 */
function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Overdue';
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * "Extended by 1 non-working day" — explains why `dueAt` moved further out than the raw
 * priority budget would suggest. Shown to Customer too (not just Staff/Manager): a deadline
 * that quietly slips reads as the company stalling, so the reason has to be visible wherever
 * the countdown is.
 */
function formatCalendarExtensionLabel(days?: number): string | null {
  if (!days || days <= 0) return null;
  return days === 1 ? 'Extended by 1 non-working day' : `Extended by ${days} non-working days`;
}

/**
 * ["02/09", "03/09"] — parses the "yyyy-MM-dd" (DateOnly) string by hand instead of
 * `new Date(iso)`: that constructor reads a date-only string as UTC midnight, which shifts a
 * day earlier once rendered in a timezone behind UTC. The year is appended only when the
 * range crosses one (e.g. 30/12 → 02/01), so the common single-year case stays compact.
 */
function formatCalendarExtensionDays(days?: string[]): string[] {
  if (!days?.length) return [];
  const years = new Set(days.map((iso) => iso.slice(0, 4)));
  const spansMultipleYears = years.size > 1;
  return days.map((iso) => {
    const [year, month, day] = iso.split('-');
    if (!year || !month || !day) return iso;
    return spansMultipleYears ? `${day}/${month}/${year}` : `${day}/${month}`;
  });
}

export function SlaCountdown({ sla, compact = false }: Props) {
  const isBreached = sla.status === 'Breached';
  const isPaused = sla.status === 'Paused';
  const isMet = sla.status === 'Met';

  // Tick để đồng hồ thực sự đếm lùi. Dừng khi timer không còn chạy — không có lý do
  // để re-render mỗi giây một ticket đã đóng/tạm dừng.
  const isLive = !isMet && !isPaused && !isBreached;
  const [now, setNow] = useState(() => Date.now());

  // Hai tốc độ: mỗi list row mount một interval riêng, mà `formatRemaining` chỉ hiện
  // giây khi còn dưới 1 giờ — trên mức đó, tick 1s là 30 lần re-render thừa mỗi phút
  // cho mỗi dòng.
  // ponytail: two-speed tick; gom về một clock context dùng chung nếu list vượt ~200 dòng
  const dueAtMs = new Date(sla.dueAt).getTime();
  const tickPeriod = dueAtMs - now < 3_600_000 ? 1_000 : 30_000;

  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setNow(Date.now()), tickPeriod);
    return () => clearInterval(id);
  }, [isLive, tickPeriod]);

  const remainingMs = useMemo(
    () => new Date(sla.dueAt).getTime() - now,
    [sla.dueAt, now],
  );

  const calendarExtensionLabel = formatCalendarExtensionLabel(sla.calendarExtensionDays?.length);
  const calendarExtensionDays = formatCalendarExtensionDays(sla.calendarExtensionDays);

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

  // Bản gọn — góc trên phải của một dòng ticket. Chỉ icon + số: thanh progress ở
  // kích thước đó không đọc được, chỉ thêm nhiễu cạnh dải ưu tiên bên trái.
  //
  // Breach phải KHÁC HẲN một đồng hồ đang chạy, không chỉ đổi màu chữ: nền đặc
  // + icon cảnh báo + chữ hoa. Priority không tự nhảy bậc khi breach
  // (design.md §Priority Policy), nên dòng ticket là chỗ duy nhất báo trạng thái
  // này cho tới khi Manager reassign.
  if (compact) {
    if (isBreached) {
      return (
        <View style={[styles.row, styles.compactWrap, styles.breachWrap]}>
          <Ionicons name="alert-circle" size={13} color={BadgeColors.crit.text} />
          <Text style={styles.breachLabel} numberOfLines={1}>
            {formatOverdue(remainingMs)}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.row, styles.compactWrap, { backgroundColor: trackColor }]}>
        <Ionicons name={icon} size={12} color={color} />
        <Text style={[styles.compactLabel, { color }]} numberOfLines={1}>
          {isPaused ? 'Paused' : label}
        </Text>
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

      {calendarExtensionLabel && (
        <View style={styles.extensionBox}>
          <Text style={styles.extensionLabel}>{calendarExtensionLabel}:</Text>
          {calendarExtensionDays.map((day) => (
            <Text key={day} style={styles.extensionDay}>
              - {day}
            </Text>
          ))}
        </View>
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

  // "Extended by N non-working day(s)" — why dueAt moved out, with each date on its own row.
  extensionBox: { gap: 2 },
  extensionLabel: { fontSize: 11, fontStyle: 'italic', color: Colors.textFaint },
  extensionDay: { fontSize: 11, fontWeight: '800', color: Colors.textMute },

  // Bản gọn — dùng trong TicketCard.
  compactWrap: {
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  compactLabel: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  // BadgeColors.crit is the accessible pair (>=4.5:1). White on #FF3B30 is 3.4:1
  // and would fail AA at this size.
  breachWrap: { backgroundColor: BadgeColors.crit.bg },
  breachLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: BadgeColors.crit.text,
    fontVariant: ['tabular-nums'],
  },
});
