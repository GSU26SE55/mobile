import { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { ActivityActionEnum, TicketActivityDTO, TicketStatusEnum } from '@/src/features/tickets/types/ticket.types';

interface Props {
  activities: TicketActivityDTO[];
  status: TicketStatusEnum;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = h > 0 ? [h, m, s] : [m, s];
  return parts.map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Đếm thời gian đã xử lý kể từ lần chuyển InProgress gần nhất — tự reset mỗi khi
 * staff Resume sau Hold (đúng ý nghĩa "đang xử lý bao lâu rồi", không phải tổng cộng
 * dồn). Suy ra từ activity log đã fetch sẵn cho tab Lịch sử — không gọi thêm API.
 */
export function ProcessingDurationTimer({ activities, status }: Props) {
  const startedAt = useMemo(() => {
    const entries = activities.filter(
      (a) => a.action === ActivityActionEnum.StatusChanged && a.newValue === TicketStatusEnum.InProgress,
    );
    if (entries.length === 0) return null;
    return entries.reduce((latest, a) =>
      new Date(a.createdAt) > new Date(latest.createdAt) ? a : latest,
    ).createdAt;
  }, [activities]);

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
