import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { blogService } from '../services/blog.service';

const STALE_TIME = 10 * 60 * 1000;

export function useBlogDetail(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.blog.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await blogService.getDetail(id);
      return res.data.data;
    },
    staleTime: STALE_TIME,
    enabled: !!id,
    // Post archived/removed → BE returns 404. No retry, show empty state immediately.
    retry: false,
  });
}
