import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { incidentService } from '../services/incident.service';
import { IncidentListParams } from '../types/incident.types';

// List incident chung (Staff — toàn bộ site). BE default pageSize=50 → truyền 100 cho nhất quán.
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
