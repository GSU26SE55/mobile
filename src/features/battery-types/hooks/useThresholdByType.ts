import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { HttpError } from '@/src/lib/errors';
import { batteryTypeService } from '../services/battery-type.service';

/**
 * Current alert threshold for a single battery type.
 *
 * Resolves to `null` when Admin has not configured a threshold for the type
 * yet, so the UI shows "not configured" instead of firing a red toast. BE now
 * returns 200 with `data: null` for that case; the 404 branch below is kept to
 * stay compatible with BE builds predating that change. Other errors (403/500)
 * are still thrown as usual.
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
