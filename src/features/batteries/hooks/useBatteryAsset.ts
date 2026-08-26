import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { batteryService } from '../services/battery.service';

export function useBatteryAsset(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.detail(id),
    queryFn: () => batteryService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}
