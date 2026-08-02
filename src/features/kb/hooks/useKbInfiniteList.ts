import { useInfiniteQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { kbService } from '../services/kb.service';
import type { KbListParams } from '../types/kb.types';

const STALE_TIME = 5 * 60 * 1000;
const PAGE_SIZE = 15;

export function useKbInfiniteList(params?: Omit<KbListParams, 'pageNumber'>) {
  return useInfiniteQuery({
    queryKey: QUERY_KEY.kb.infinite(params as Record<string, unknown> | undefined),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await kbService.getList({
        ...params,
        pageNumber: pageParam as number,
        pageSize: params?.pageSize ?? PAGE_SIZE,
      });
      return res.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last?.hasNextPage ? last.pageNumber + 1 : undefined,
    staleTime: STALE_TIME,
  });
}
