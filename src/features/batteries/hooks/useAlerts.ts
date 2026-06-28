import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { alertService } from '../services/alert.service';
import { AlertListParams } from '../types/alert.types';

// GH-55 — list alert chung (Staff xem toàn bộ, không scope theo pin).
// Khác useMyAlerts (Customer — gom theo batteryAssetId của pin mình).
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
