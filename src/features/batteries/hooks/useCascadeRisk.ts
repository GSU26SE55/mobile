import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { batteryService } from '../services/battery.service';

// 404 = asset không tồn tại / chưa tính → ẩn badge, KHÔNG retry.
export function useCascadeRisk(assetId: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.cascadeRisk(assetId),
    queryFn: () =>
      batteryService.getCascadeRisk(assetId).then((r) => r.data.data),
    enabled: !!assetId,
    retry: false,
  });
}
