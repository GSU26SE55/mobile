import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { HttpError } from '@/src/lib/errors';
import { batteryTypeService } from '../services/battery-type.service';

/**
 * Current alert threshold for a single battery type.
 *
 * BE returns 404 when the battery type has no threshold configured by
 * Admin yet — that is a valid state, not an error, so the 404 is swallowed
 * into `null` so the UI shows "not configured" instead of firing a red
 * toast. Other errors (403/500) are still thrown as usual.
 */
export function useThresholdByType(batteryTypeId: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryTypes.threshold(batteryTypeId),
    queryFn: () =>
      batteryTypeService
        .getThresholdByType(batteryTypeId)
        .then((r) => r.data.data ?? null)
        .catch((err) => {
          if (err instanceof HttpError && err.statusCode === 404) return null;
          throw err;
        }),
    enabled: !!batteryTypeId,
    staleTime: 10 * 60 * 1000, // threshold rarely changes — cache long like battery config
  });
}
