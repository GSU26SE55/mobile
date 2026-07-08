import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { siteService } from '../services/site.service';

export function useSiteDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.sites.detail(id),
    queryFn: () => siteService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}
