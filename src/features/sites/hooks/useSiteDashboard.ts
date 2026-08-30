import { useQuery } from '@tanstack/react-query';
import { useIsFocusedSafe } from '@/src/hooks/useIsFocusedSafe';
import { useRefetchOnFocus } from '@/src/hooks/useRefetchOnFocus';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { siteService } from '../services/site.service';

// Dashboard stats — healthScore + open-alert count, so they refresh on the same 30s beat as
// the Web site detail rather than sitting a minute behind. Polling is gated on focus: this
// screen can stay mounted behind another tab, and a background poll would spend battery and
// mobile data redrawing nothing.
export function useSiteDashboard(id: string) {
  const isFocused = useIsFocusedSafe();
  const query = useQuery({
    queryKey: QUERY_KEY.sites.dashboard(id),
    queryFn: () => siteService.getDashboard(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 30_000,
    refetchInterval: isFocused ? 30_000 : false,
    refetchIntervalInBackground: false,
    // refetchOnWindowFocus targets the browser `window.focus` event — never fires on RN.
    refetchOnWindowFocus: false,
  });
  useRefetchOnFocus(isFocused, query);
  return query;
}
