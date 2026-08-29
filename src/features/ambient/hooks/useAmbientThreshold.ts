import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ambientService } from '../services/ambient.service';

/**
 * Site's ambient threshold config. Resolves to `null` for a site with no config — BE
 * returns 200 with `data: null` for that, a normal state meaning "not monitored" rather
 * than a failure. Callers treat a nullish value as "do not colour anything". `retry: false`
 * is kept so a genuine error (403/500) surfaces at once instead of after a backoff.
 */
export function useAmbientThreshold(siteId: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.ambient.thresholdBySite(siteId ?? ''),
    queryFn: async () => (await ambientService.getThresholdBySite(siteId!)).data.data ?? null,
    enabled: !!siteId,
    staleTime: 10 * 60_000,
    retry: false,
  });
}
