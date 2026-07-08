import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import { SensorReadingInterval } from '../types/sensor-reading.types';

interface UseSensorReadingAggregateOptions {
  hours: number; // khoảng thời gian lùi từ hiện tại — `from` tính lại mỗi lần fetch
  interval: SensorReadingInterval;
}

// Dữ liệu bucket cho chart — poll mỗi 30s để chart tự cập nhật khi có reading mới.
export function useSensorReadingAggregate(
  assetId: string,
  opts: UseSensorReadingAggregateOptions,
) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.aggregate(assetId, opts as unknown as Record<string, unknown>),
    queryFn: () => {
      const from = new Date(Date.now() - opts.hours * 3_600_000).toISOString();
      return sensorReadingService
        .getAggregate(assetId, { from, interval: opts.interval })
        .then((r) => r.data.data ?? []);
    },
    enabled: !!assetId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
