import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { kbService } from '../services/kb.service';

const STALE_TIME = 10 * 60 * 1000;

export function useKbDetail(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.kb.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await kbService.getDetail(id);
      return res.data.data;
    },
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}
