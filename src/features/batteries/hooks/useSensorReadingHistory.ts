import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import { SensorReadingHistoryParams } from '../types/sensor-reading.types';

// Trang đầu lịch sử (limit 100). Infinite scroll bằng nextCursor để issue sau nếu cần.
export function useSensorReadingHistory(
  assetId: string,
  params?: SensorReadingHistoryParams,
) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.history(
      assetId,
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () =>
      sensorReadingService.getHistory(assetId, params).then((r) => r.data.data),
    enabled: !!assetId,
  });
}
