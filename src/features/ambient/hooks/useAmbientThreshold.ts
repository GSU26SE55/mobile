import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ambientService } from '../services/ambient.service';

/**
 * Site's ambient threshold config. `retry: false` deliberately — a site with no config
 * returns an error, and that is a normal state meaning "not monitored", not a failure
 * worth retrying. Callers treat undefined as "do not colour anything".
 */
export function useAmbientThreshold(siteId: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.ambient.thresholdBySite(siteId ?? ''),
    queryFn: async () => (await ambientService.getThresholdBySite(siteId!)).data.data,
    enabled: !!siteId,
    staleTime: 10 * 60_000,
    retry: false,
  });
}
