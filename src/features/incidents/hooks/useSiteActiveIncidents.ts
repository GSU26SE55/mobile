import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { incidentService } from '../services/incident.service';

// GH-68 — Active incidents (Open+Acknowledged) for 1 site, 1 server-side call.
// Site detail widget only renders when items.length > 0.
export function useSiteActiveIncidents(siteId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.incidents.bySiteActive(siteId ?? ''),
    queryFn: async () => {
      const res = await incidentService.getActiveBySite(siteId!);
      return res.data.data?.items ?? [];
    },
    enabled: !!siteId,
    staleTime: 60 * 1000,
  });
}
