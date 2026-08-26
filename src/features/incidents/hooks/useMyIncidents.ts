import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { incidentService } from '../services/incident.service';
import { useMyBatteryAssets } from '@/src/features/batteries/hooks/useMyBatteryAssets';
import { EnvironmentalIncidentDto } from '../types/incident.types';

// Customer incidents = site-level incidents for sites with ≥1 battery owned by the customer.
// ⚠️ GET /api/environmental-incidents is NOT scoped by user → must filter by the siteId
// of the customer's own batteries, otherwise incidents from other sites would leak through.
// Differs from useMyAlerts (scoped by batteryAssetId) — incidents are site-level so scope by siteId.
//
// INTENTIONAL data exposure: if a site has batteries from multiple customers, a customer sees
// that site's incidents — acceptable because fire/flood is a site-wide incident, not tied to 1 battery.
export function useMyIncidents() {
  const { data: batteries = [] } = useMyBatteryAssets();

  // siteId non-null + distinct; batteries without a site assigned (siteId=null) → skipped.
  const siteIds = Array.from(
    new Set(batteries.map((b) => b.siteId).filter((id): id is string => !!id)),
  );
  // Map siteId → siteName so the card can display the site name (incident DTO has no siteName).
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
