import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { kbSuggestionService } from '../services/kbSuggestion.service';

/**
 * KB document suggestions for the ticket being handled.
 *
 * Permissions (BE-enforced): Manager/Admin can view any ticket; Staff must be ASSIGNED to
 * the ticket (PrimaryHandler or Supporter). Not assigned → 403 → hook returns `error`.
 *
 * `enabled` allows lazy fetching: only fetch when the user opens the suggestions tab/panel,
 * to avoid firing an AI request for every ticket just opened for viewing.
 *
 * `retry: false` — if the AI is temporarily unavailable, BE already returns 200 with
 * `aiAvailable=false`; retrying only makes the user wait longer without changing the result.
 */
export function useKbSuggestions(
  ticketId: string | undefined,
  options?: { topN?: number; enabled?: boolean },
) {
  const topN = options?.topN ?? 5;
  return useQuery({
    queryKey: QUERY_KEY.tickets.kbSuggestions(ticketId ?? '', topN),
    queryFn: async () => {
      const res = await kbSuggestionService.list(ticketId!, topN);
      return res.data.data;
    },
    enabled: Boolean(ticketId) && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
