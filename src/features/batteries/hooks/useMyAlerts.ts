import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { alertService } from '../services/alert.service';
import { useMyBatteryAssets } from './useMyBatteryAssets';
import { AlertDto } from '../types/alert.types';

// Customer's alerts = alerts from ALL batteries the Customer owns, merged together.
// ⚠️ BE GET /api/alerts is NOT scoped by user (see AlertsController) → must filter manually by
// each of the Customer's batteryAssetId, otherwise we'd receive other customers' alerts (data leak).
export function useMyAlerts() {
  const { data: batteries = [] } = useMyBatteryAssets();
  const ids = batteries.map((b) => b.id);

  return useQuery({
    queryKey: QUERY_KEY.alerts.list({ mine: true, ids }),
    enabled: ids.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        ids.map((id) => alertService.getList({ batteryAssetId: id, pageSize: 100 })),
      );
      const all: AlertDto[] = results.flatMap((res) => res.data.data?.items ?? []);
      return all.sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
      );
    },
  });
}
