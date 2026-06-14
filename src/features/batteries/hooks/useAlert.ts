import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { alertService } from '../services/alert.service';

export function useAlert(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.alerts.detail(id),
    queryFn: () => alertService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}
