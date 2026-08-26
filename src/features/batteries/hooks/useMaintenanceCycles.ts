import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { batteryService } from '../services/battery.service';

/**
 * Nhật ký bảo trì định kỳ của một cục pin — kỳ mới nhất trước.
 *
 * Đọc từ BatteryService: chu kỳ là thuộc tính của tài sản, không phải của ticket.
 */
export function useMaintenanceCycles(assetId: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.maintenanceCycles(assetId),
    queryFn: () =>
      batteryService.getMaintenanceCycles(assetId).then((r) => r.data.data ?? []),
    enabled: !!assetId,
    staleTime: 60_000,
  });
}
