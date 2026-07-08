import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '../../../lib/queryKeys';
import { kbService } from '../services/kb.service';
import type { KbArticleDTO, KbArticleSummaryDTO } from '../types/kb.types';

export function useMarkKbHelpful() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => kbService.markHelpful(id),

    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: KEY.kb });

      // Snapshot cache trước khi optimistic update — để rollback nếu request fail.
      const prevLists = qc.getQueriesData({ queryKey: KEY.kb, type: 'active' });
      const prevDetail = qc.getQueryData<KbArticleDTO>(QUERY_KEY.kb.detail(id));

      // optimistic update trên infinite list cache
      qc.setQueriesData<{ pages: { items: KbArticleSummaryDTO[] }[] }>(
        { queryKey: KEY.kb, type: 'active' },
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items?.map((item) =>
                item.id === id
                  ? { ...item, helpfulCount: item.helpfulCount + 1 }
                  : item,
              ) ?? page.items,
            })),
          };
        },
      );

      // optimistic update trên detail cache
      qc.setQueryData<KbArticleDTO>(
        QUERY_KEY.kb.detail(id),
        (old) => old ? { ...old, helpfulCount: old.helpfulCount + 1 } : old,
      );

      return { prevLists, prevDetail };
    },

    // Fail → khôi phục cache về trạng thái trước optimistic (count không bị sai +1 vĩnh viễn).
    onError: (_err, id, context) => {
      context?.prevLists?.forEach(([key, data]) => qc.setQueryData(key, data));
      if (context?.prevDetail) qc.setQueryData(QUERY_KEY.kb.detail(id), context.prevDetail);
    },

    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: KEY.kb });
    },
  });
}
