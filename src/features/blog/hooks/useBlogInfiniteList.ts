import { useInfiniteQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { blogService } from '../services/blog.service';
import type { BlogListParams } from '../types/blog.types';

const STALE_TIME = 5 * 60 * 1000;
const PAGE_SIZE = 10;

export function useBlogInfiniteList(params?: Omit<BlogListParams, 'pageNumber'>) {
  return useInfiniteQuery({
    queryKey: QUERY_KEY.blog.infinite(params as Record<string, unknown> | undefined),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await blogService.getList({
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
