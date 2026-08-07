import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import {
  BatteryStatsView,
  SensorReadingAggregateDto,
  StatsWindow,
} from '../types/sensor-reading.types';

// Mốc đầu window (UTC) — '1h' = đầu giờ hiện tại, 'today' = 00:00 UTC hôm nay.
function windowStartOf(window: StatsWindow): Date {
  const d = new Date();
  d.setUTCMilliseconds(0);
  d.setUTCSeconds(0);
  d.setUTCMinutes(0);
  if (window === 'today') d.setUTCHours(0);
  return d;
}

function aggregateToSeed(agg: SensorReadingAggregateDto, window: StatsWindow): BatteryStatsView {
  return {
    window,
    windowStart: agg.time,
    maxChargeCurrent: agg.maxChargeCurrent,
    minChargeCurrent: agg.minChargeCurrent,
    maxDischargeCurrent: agg.maxDischargeCurrent,
    minDischargeCurrent: agg.minDischargeCurrent,
    chargeSampleCount: agg.chargeSampleCount,
    dischargeSampleCount: agg.dischargeSampleCount,
    updatedAt: agg.time,
    isSeed: true,
  };
}

/**
 * Min/max dòng nạp-xả của 1 window cho 1 pin.
 *
 * Nguồn dữ liệu: SSE event `stats` (push, qua `useBatterySensorStream` → `setQueryData` cùng key).
 * Hook này CHỈ lo phần seed: `stats` chỉ đẩy incremental (§5.3bis) nên lúc mở màn chưa có gì —
 * seed 1 lần từ bucket cuối của REST `/aggregate` để UI không trống.
 *
 * `staleTime: Infinity` + không `refetchInterval`: fetch đúng 1 lần rồi để SSE làm chủ.
 * Nếu refetch, seed cũ sẽ ĐÈ NGƯỢC dữ liệu SSE mới hơn.
 *
 * `Realtime:Enabled=false` → không bao giờ có `stats` → view giữ nguyên seed (`isSeed: true`).
 * Đây là trạng thái HỢP LỆ, không phải lỗi.
 */
export function useBatteryStats(assetId: string, window: StatsWindow) {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEY.sensorReadings.stats(assetId, window);

  return useQuery<BatteryStatsView | null>({
    queryKey,
    queryFn: async () => {
      // Chống race: event `stats` có thể về TRONG LÚC fetch seed đang bay (hoặc đã về từ lần mount trước).
      // Không có guard này, seed cũ hơn sẽ ĐÈ NGƯỢC data SSE mới hơn khi fetch resolve.
      const existing = queryClient.getQueryData<BatteryStatsView | null>(queryKey);
      if (existing && !existing.isSeed) return existing;

      const start = windowStartOf(window);
      const res = await sensorReadingService.getAggregate(assetId, {
        from: start.toISOString(),
        interval: window === 'today' ? '1d' : '1h',
      });
      const buckets = res.data.data ?? [];
      // Bucket cuối = window hiện tại. Rỗng (pin chưa có reading nào trong window) → null, UI hiện '—'.
      const last = buckets.length > 0 ? buckets[buckets.length - 1] : null;
      return last ? aggregateToSeed(last, window) : null;
    },
    enabled: !!assetId,
    staleTime: Infinity,
  });
}
