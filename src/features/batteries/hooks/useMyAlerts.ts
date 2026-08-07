import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { alertService } from '../services/alert.service';
import { useMyBatteryAssets } from './useMyBatteryAssets';
import { AlertDto } from '../types/alert.types';

// Alert của Customer = gộp alert của TẤT CẢ pin Customer sở hữu.
// ⚠️ BE GET /api/alerts KHÔNG scope theo user (xem AlertsController) → phải tự lọc theo
// từng batteryAssetId của Customer, nếu không sẽ nhận alert của khách hàng khác (rò rỉ dữ liệu).
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
