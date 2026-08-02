import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { incidentService } from '../services/incident.service';

export function useIncident(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.incidents.detail(id),
    queryFn: () => incidentService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}
