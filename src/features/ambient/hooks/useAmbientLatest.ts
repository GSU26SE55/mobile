import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ambientService } from '../services/ambient.service';

// 404 = site has no ambient reading yet → treat as "no data", do NOT retry.
export function useAmbientLatest(siteId: string) {
  return useQuery({
    queryKey: QUERY_KEY.ambient.latest(siteId),
    queryFn: () => ambientService.getLatest(siteId).then((r) => r.data.data),
    enabled: !!siteId,
    retry: false,
  });
}
