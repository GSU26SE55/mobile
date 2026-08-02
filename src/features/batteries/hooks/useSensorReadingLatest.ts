import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';

export function useSensorReadingLatest(assetId: string) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.latest(assetId),
    queryFn: () => sensorReadingService.getLatest(assetId).then((r) => r.data.data),
    enabled: !!assetId,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}
