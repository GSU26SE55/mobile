import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { batteryService } from '../services/battery.service';

// Snapshot realtime — poll mỗi 30s (nhất quán Web: staleTime 0 + refetchInterval).
export function useBatteryAssetRealtime(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.realtime(id),
    queryFn: () => batteryService.getRealtime(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}
