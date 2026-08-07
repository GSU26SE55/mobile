import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { siteService } from '../services/site.service';

export function useMySites() {
  return useQuery({
    queryKey: QUERY_KEY.sites.me({ pageSize: 100 }),
    queryFn: async () => {
      const res = await siteService.getMySites({ pageSize: 100 });
      return res.data.data?.items ?? [];
    },
  });
}
