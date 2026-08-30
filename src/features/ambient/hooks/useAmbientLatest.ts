import { useQuery } from '@tanstack/react-query';
import { useIsFocusedSafe } from '@/src/hooks/useIsFocusedSafe';
import { useRefetchOnFocus } from '@/src/hooks/useRefetchOnFocus';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ambientService } from '../services/ambient.service';

// The site's current temperature/humidity, so it refreshes on the same 30s beat as
// useAmbientTrend beside it — it had no staleTime at all, leaving the reading on the global
// 2-minute default while the chart under it moved. Polling is gated on focus: a background
// poll would spend battery and mobile data redrawing nothing.
// 404 = site has no ambient reading yet → treat as "no data", do NOT retry.
export function useAmbientLatest(siteId: string) {
  const isFocused = useIsFocusedSafe();
  const query = useQuery({
    queryKey: QUERY_KEY.ambient.latest(siteId),
    queryFn: () => ambientService.getLatest(siteId).then((r) => r.data.data),
    enabled: !!siteId,
    retry: false,
    staleTime: 30_000,
    refetchInterval: isFocused ? 30_000 : false,
    refetchIntervalInBackground: false,
    // refetchOnWindowFocus targets the browser `window.focus` event — never fires on RN.
    refetchOnWindowFocus: false,
  });
  useRefetchOnFocus(isFocused, query);
  return query;
}
