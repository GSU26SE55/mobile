import { useQueries, useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { kbService } from '../services/kb.service';
import type { TicketCategoryEnum } from '../../../shared/enums/ticket.enum';
import type { KbArticleSummaryDTO } from '../types/kb.types';

const STALE_TIME_DETAIL = 10 * 60 * 1000;
const STALE_TIME_LIST = 5 * 60 * 1000;

export interface UseRelatedKbArgs {
  relatedIds: string[];
  fallbackCategory: TicketCategoryEnum | null;
  fallbackLimit?: number;
}

export interface UseRelatedKbResult {
  data: KbArticleSummaryDTO[];
  isLoading: boolean;
  source: 'primary' | 'fallback' | 'empty';
}

export function useRelatedKb(args: UseRelatedKbArgs): UseRelatedKbResult {
  const { relatedIds, fallbackCategory, fallbackLimit = 3 } = args;
  const hasPrimary = relatedIds.length > 0;

  const primary = useQueries({
    queries: relatedIds.map((id) => ({
      queryKey: QUERY_KEY.kb.detail(id),
      queryFn: async () => {
        const res = await kbService.getDetail(id);
        return res.data.data;
      },
      staleTime: STALE_TIME_DETAIL,
      enabled: hasPrimary,
    })),
  });

  const fallback = useQuery({
    queryKey: QUERY_KEY.kb.list({
      category: fallbackCategory,
      pageSize: fallbackLimit,
      fallback: true,
    }),
    queryFn: async () => {
      const res = await kbService.getList({
        category: fallbackCategory ?? undefined,
        pageSize: fallbackLimit,
      });
      return res.data.data?.items ?? [];
    },
    staleTime: STALE_TIME_LIST,
    enabled: !hasPrimary && !!fallbackCategory,
  });

  if (hasPrimary) {
    const isLoading = primary.some((q) => q.isLoading);
    const items = primary
      .map((q) => q.data)
      .filter((a): a is NonNullable<typeof a> => !!a)
      .map<KbArticleSummaryDTO>((a) => ({
        id: a.id,
        code: a.code,
        title: a.title,
        category: a.category,
        status: a.status,
        viewCount: a.viewCount,
        helpfulCount: a.helpfulCount,
        reviewRequired: a.reviewRequired,
        createdAt: a.createdAt,
      }));
    return {
      data: items,
      isLoading,
      source: items.length > 0 ? 'primary' : 'empty',
    };
  }

  if (fallbackCategory) {
    return {
      data: fallback.data ?? [],
      isLoading: fallback.isLoading,
      source: (fallback.data?.length ?? 0) > 0 ? 'fallback' : 'empty',
    };
  }

  return { data: [], isLoading: false, source: 'empty' };
}
