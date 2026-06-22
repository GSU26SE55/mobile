import { useInfiniteQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { ticketService } from '../services/ticket.service';

const PAGE_SIZE = 10;

// GH-44 #1 — danh sách comment phân trang (BE sort DESC newest-first).
// Scroll chạm đáy → fetchNextPage. Realtime (useTicketCommentsRealtime) prepend comment mới qua setQueryData.
export function useTicketComments(ticketId: string | undefined) {
  return useInfiniteQuery({
    queryKey: QUERY_KEY.tickets.comments(ticketId ?? ''),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await ticketService.getComments(ticketId!, {
        page: pageParam as number,
        pageSize: PAGE_SIZE,
      });
      return res.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.hasNextPage ? last.pageNumber + 1 : undefined),
    enabled: !!ticketId,
    staleTime: 30 * 1000,
  });
}
