import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import { SensorReadingAggregateParams } from '../types/sensor-reading.types';

// Dữ liệu bucket cho chart. Mặc định 24h gần nhất, interval 1h.
export function useSensorReadingAggregate(
  assetId: string,
  params?: SensorReadingAggregateParams,
) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.aggregate(
      assetId,
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () =>
      sensorReadingService
        .getAggregate(assetId, params)
        .then((r) => r.data.data ?? []),
    enabled: !!assetId,
  });
}
