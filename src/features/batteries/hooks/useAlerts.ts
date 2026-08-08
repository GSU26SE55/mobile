import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { alertService } from '../services/alert.service';
import { AlertListParams } from '../types/alert.types';

// GH-55 — general alert list (Staff sees everything, not scoped by battery).
// Different from useMyAlerts (Customer — aggregated by their own batteryAssetId).
export function useAlerts(params?: AlertListParams) {
  const merged: AlertListParams = { pageSize: 100, ...params };
  return useQuery({
    queryKey: QUERY_KEY.alerts.list(merged as Record<string, unknown>),
    queryFn: async () => {
      const res = await alertService.getList(merged);
      return res.data.data?.items ?? [];
    },
  });
}
