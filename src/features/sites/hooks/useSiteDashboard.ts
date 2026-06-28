import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { siteService } from '../services/site.service';

// Dashboard stats — staleTime 1 phút (giống Web: dashboard stats).
export function useSiteDashboard(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.sites.dashboard(id),
    queryFn: () => siteService.getDashboard(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 60_000,
  });
}
