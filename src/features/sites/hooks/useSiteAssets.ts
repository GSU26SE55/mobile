import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { siteService } from '../services/site.service';

export function useSiteAssets(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.sites.assets(id, { pageSize: 100 }),
    queryFn: async () => {
      const res = await siteService.getAssets(id, { pageSize: 100 });
      return res.data.data?.items ?? [];
    },
    enabled: !!id,
  });
}
