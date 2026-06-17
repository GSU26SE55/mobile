import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { knowledgeBaseService } from '../services/knowledge-base.service';
import { KbListParams } from '../types/knowledge-base.types';

export function useKbArticles(params?: KbListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEY.knowledgeBase.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await knowledgeBaseService.getList(params);
      return res.data.data;
    },
    enabled: options?.enabled ?? true,
  });
}
