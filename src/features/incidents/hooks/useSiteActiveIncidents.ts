import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { incidentService } from '../services/incident.service';

// GH-68 — incident đang Active (Open+Acknowledged) của 1 site, 1 call server-side.
// Widget site detail chỉ render khi items.length > 0.
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
