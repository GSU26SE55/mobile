import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { incidentService } from '../services/incident.service';
import { useMyBatteryAssets } from '../../batteries/hooks/useMyBatteryAssets';
import { EnvironmentalIncidentDto } from '../types/incident.types';

// Incident của Customer = incident cấp-site của các site có ≥1 pin Customer sở hữu.
// ⚠️ GET /api/environmental-incidents KHÔNG scope theo user → phải tự lọc theo siteId
// của pin mình, nếu không sẽ nhận incident của site khác (rò rỉ dữ liệu).
// Khác useMyAlerts (scope theo batteryAssetId) — incident là cấp site nên scope theo siteId.
//
// Lộ-dữ-liệu CỐ Ý: nếu 1 site có pin của nhiều Customer, Customer thấy incident site đó —
// chấp nhận được vì cháy/ngập là sự cố toàn site, không gắn 1 pin cụ thể.
export function useMyIncidents() {
  const { data: batteries = [] } = useMyBatteryAssets();

  // siteId non-null + distinct; pin chưa gán site (siteId=null) → bỏ qua.
  const siteIds = Array.from(
    new Set(batteries.map((b) => b.siteId).filter((id): id is string => !!id)),
  );
  // Map siteId → siteName để card hiển thị tên site (DTO incident không có siteName).
  const siteNameMap: Record<string, string> = {};
  batteries.forEach((b) => {
    if (b.siteId && b.siteName) siteNameMap[b.siteId] = b.siteName;
  });

  const query = useQuery({
    queryKey: QUERY_KEY.incidents.list({ mine: true, siteIds }),
    enabled: siteIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        siteIds.map((siteId) => incidentService.getList({ siteId, pageSize: 100 })),
      );
      const all: EnvironmentalIncidentDto[] = results.flatMap(
        (res) => res.data.data?.items ?? [],
      );
      return all.sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
      );
    },
  });

  return { ...query, siteNameMap };
}
