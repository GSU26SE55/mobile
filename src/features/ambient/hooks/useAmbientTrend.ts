import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { ambientService } from '../services/ambient.service';
import { AmbientTrendParams } from '../types/ambient.types';

export function useAmbientTrend(siteId: string, params?: AmbientTrendParams) {
  return useQuery({
    queryKey: QUERY_KEY.ambient.trend(
      siteId,
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () =>
      ambientService.getTrend(siteId, params).then((r) => r.data.data ?? []),
    enabled: !!siteId,
  });
}
