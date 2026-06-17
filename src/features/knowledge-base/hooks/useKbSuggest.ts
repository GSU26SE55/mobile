import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { knowledgeBaseService } from '../services/knowledge-base.service';

// Gợi ý bài viết liên quan theo ticket (chỉ chạy khi có ticketId).
export function useKbSuggest(ticketId?: string) {
  return useQuery({
    queryKey: QUERY_KEY.knowledgeBase.suggest(ticketId ?? ''),
    queryFn: async () => {
      const res = await knowledgeBaseService.suggest(ticketId!);
      return res.data.data;
    },
    enabled: !!ticketId,
  });
}
