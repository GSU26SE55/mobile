import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { incidentService } from '../services/incident.service';
import { IncidentListParams } from '../types/incident.types';

// Shared incident list (Staff — all sites). BE default pageSize=50 → pass 100 for consistency.
export function useIncidents(params?: IncidentListParams) {
  const merged: IncidentListParams = { pageSize: 100, ...params };
  return useQuery({
    queryKey: QUERY_KEY.incidents.list(merged as Record<string, unknown>),
    queryFn: async () => {
      const res = await incidentService.getList(merged);
      return res.data.data?.items ?? [];
    },
  });
}
