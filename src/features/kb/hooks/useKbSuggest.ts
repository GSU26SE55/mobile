import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { kbService } from '../services/kb.service';

// GH-44 #7 — gợi ý KB theo ticket (server-driven, ≤5 bài Published). Thay useRelatedKb cũ (client-side).
export function useKbSuggest(ticketId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.kb.suggest(ticketId ?? ''),
    queryFn: async () => {
      const res = await kbService.suggest(ticketId!);
      return res.data.data ?? [];
    },
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000,
  });
}
