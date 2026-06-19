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
    },

    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: KEY.kb });
    },
  });
}
