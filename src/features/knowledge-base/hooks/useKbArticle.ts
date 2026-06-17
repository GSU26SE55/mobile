import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { knowledgeBaseService } from '../services/knowledge-base.service';

export function useKbArticle(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.knowledgeBase.detail(id),
    queryFn: async () => {
      const res = await knowledgeBaseService.getDetail(id);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // bài viết ít thay đổi
  });
}
