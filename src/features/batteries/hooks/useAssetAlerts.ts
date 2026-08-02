import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { alertService } from '../services/alert.service';
import { AlertListParams } from '../types/alert.types';

// Danh sách alert của một asset (read-only). excludeMerged mặc định true ở BE.
export function useAssetAlerts(batteryAssetId: string) {
  const params: AlertListParams = { batteryAssetId, pageSize: 50 };
  return useQuery({
    queryKey: QUERY_KEY.alerts.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await alertService.getList(params);
      return res.data.data?.items ?? [];
    },
    enabled: !!batteryAssetId,
  });
}
