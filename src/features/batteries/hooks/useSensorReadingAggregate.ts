import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import { SensorReadingInterval } from '../types/sensor-reading.types';

interface UseSensorReadingAggregateOptions {
  hours: number; // khoảng thời gian lùi từ hiện tại — `from` tính lại mỗi lần fetch
  interval: SensorReadingInterval;
}

// GH-74 — ngưỡng chuyển endpoint. `/aggregate` materialize rows in-memory (bounded ~7 ngày);
// range dài hơn nên dùng `/aggregate/hourly` (continuous aggregate, ~O(số bucket)).
// docs/api-battery.md L957: range ≤ 7 ngày → /aggregate; range dài + interval 1h cố định → /aggregate/hourly.
const HOURLY_THRESHOLD_HOURS = 168; // 7 ngày

/**
 * Chỉ chuyển sang /aggregate/hourly khi range dài VÀ caller thực sự muốn bucket 1h.
 *
 * ⚠️ Điều kiện `interval === '1h'` là BẮT BUỘC, không thừa: /aggregate/hourly cố định bucket 1h.
 * Nếu chỉ xét `hours`, range 30 ngày của SensorChart (interval '1d', 30 bucket) sẽ bị đẩy sang
 * hourly và nhận 720 bucket — gấp 24 lần, đổi hình dạng chart + hiệu năng của component NGOÀI scope.
 */
function shouldUseHourly(opts: UseSensorReadingAggregateOptions): boolean {
  return opts.hours > HOURLY_THRESHOLD_HOURS && opts.interval === '1h';
}

// Dữ liệu bucket cho chart — poll mỗi 30s để chart tự cập nhật khi có reading mới.
export function useSensorReadingAggregate(
  assetId: string,
  opts: UseSensorReadingAggregateOptions,
) {
  const useHourly = shouldUseHourly(opts);

  return useQuery({
    queryKey: useHourly
      ? QUERY_KEY.sensorReadings.aggregateHourly(assetId, { hours: opts.hours })
      : QUERY_KEY.sensorReadings.aggregate(assetId, opts as unknown as Record<string, unknown>),
    queryFn: () => {
      const from = new Date(Date.now() - opts.hours * 3_600_000).toISOString();
      // Range dài → hourly (KHÔNG gửi `interval` — endpoint cố định bucket 1h).
      return useHourly
        ? sensorReadingService.getAggregateHourly(assetId, { from }).then((r) => r.data.data ?? [])
        : sensorReadingService
            .getAggregate(assetId, { from, interval: opts.interval })
            .then((r) => r.data.data ?? []);
    },
    enabled: !!assetId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
