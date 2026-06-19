import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { kbService } from '../services/kb.service';
import type { KbListParams } from '../types/kb.types';

const STALE_TIME = 5 * 60 * 1000;

export function useKbList(params?: KbListParams, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEY.kb.list(params as Record<string, unknown> | undefined),
    queryFn: async () => {
      const res = await kbService.getList(params);
      return res.data.data;
    },
    staleTime: STALE_TIME,
    enabled: opts?.enabled ?? true,
  });
}
