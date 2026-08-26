import { useEffect, useRef } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Refetches a query the moment its screen transitions from unfocused → focused.
 *
 * `refetchOnWindowFocus` targets the browser `window.focus` event and never fires on React
 * Native, so without this a screen can sit on stale cached data (staleTime, app/_layout.tsx)
 * until the next refetchInterval tick — e.g. another user's action (escalate, hold, resume)
 * doesn't show up right away when navigating back to a ticket already cached within staleTime.
 */
export function useRefetchOnFocus(isFocused: boolean, query: Pick<UseQueryResult, 'refetch'>) {
  const wasFocused = useRef(isFocused);
  useEffect(() => {
    if (isFocused && !wasFocused.current) query.refetch();
    wasFocused.current = isFocused;
  }, [isFocused, query]);
}
