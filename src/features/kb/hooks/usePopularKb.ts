import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { kbService } from '../services/kb.service';
import type { KbArticleSummaryDTO } from '../types/kb.types';

const STALE_TIME = 5 * 60 * 1000;
// TODO(BE-API): add OrderBy support so popular sort can be done server-side.
const FETCH_POOL = 20;

export function usePopularKb(limit = 5) {
  return useQuery({
    queryKey: QUERY_KEY.kb.list({ popular: true, limit }),
    queryFn: async () => {
      const res = await kbService.getList({ pageSize: FETCH_POOL });
      return res.data.data?.items ?? [];
    },
    staleTime: STALE_TIME,
    select: (items: KbArticleSummaryDTO[]) =>
      [...items]
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, limit),
  });
}
