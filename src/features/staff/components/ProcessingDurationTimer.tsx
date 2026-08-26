import { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { TicketActivityDTO, TicketStatusEnum } from '@/src/features/tickets/types/ticket.types';
import { inProgressStartedAt } from '@/src/features/tickets/utils/ticketWorkflow';

interface Props {
  activities: TicketActivityDTO[];
  status: TicketStatusEnum;
}

/** `HH:MM:SS`, bỏ giờ khi dưới 1 tiếng. Dùng chung với ô Duration của MaintenanceLogForm. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = h > 0 ? [h, m, s] : [m, s];
  return parts.map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * "8h 24m" / "45m" / "2h" — thời lượng đã CHỐT của một log bảo trì.
 *
 * Khác `formatElapsed`: cái kia là đồng hồ đang chạy nên cần giây và bề rộng cố định
 * (HH:MM:SS). Log đã nộp thì giây vô nghĩa, mà "504 mins" bắt người đọc tự chia 60 để
 * biết là hơn tám tiếng.
 *
 * Bỏ phần phút khi tròn giờ ("2h" chứ không "2h 0m").
 */
export function formatDurationMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Counts processing time since the most recent transition to InProgress — resets
 * whenever staff Resumes after a Hold (matches the meaning of "how long has this
 * been in progress", not a cumulative total). Derived from the activity log already
 * fetched for the History tab — no extra API call.
 */
export function ProcessingDurationTimer({ activities, status }: Props) {
  const startedAt = useMemo(() => inProgressStartedAt(activities), [activities]);

  const [elapsedMs, setElapsedMs] = useState(() =>
    startedAt ? Date.now() - new Date(startedAt).getTime() : 0,
  );

  useEffect(() => {
    if (!startedAt || status !== TicketStatusEnum.InProgress) return;
    const tick = () => setElapsedMs(Date.now() - new Date(startedAt).getTime());
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [startedAt, status]);

  if (status !== TicketStatusEnum.InProgress || !startedAt) {
    return <Text style={{ fontSize: 12, color: Colors.textMute }}>—</Text>;
  }

  return (
    <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text, fontVariant: ['tabular-nums'] }}>
      {formatElapsed(elapsedMs)}
    </Text>
  );
}
