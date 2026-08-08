import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import { SensorReadingHistoryParams } from '../types/sensor-reading.types';

// First page of history (limit 100). Infinite scroll via nextCursor as a follow-up issue if needed.
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
