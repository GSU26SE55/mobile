import { useInfiniteQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketChatActionsService } from '../services/ticketChatActions.service';

const LIMIT = 20;

// GH-68 — cursor pagination cho chat (thay useTicketComments page-based). Giữ key
// tickets.chats(id) để realtime (useTicketCommentsRealtime) prepend + invalidate không vỡ.
// BE sort DESC (mới nhất đầu); scroll chạm đáy → fetchNextPage (lịch sử cũ hơn).
export function useTicketChatsCursor(ticketId: string | undefined) {
  return useInfiniteQuery({
    queryKey: QUERY_KEY.tickets.chats(ticketId ?? ''),
    queryFn: async ({ pageParam }) => {
      const res = await ticketChatActionsService.listCursor(ticketId!, {
        cursor: pageParam ?? undefined,
        limit: LIMIT,
      });
      return res.data.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last?.hasMore ? last.nextCursor ?? undefined : undefined),
    enabled: !!ticketId,
    staleTime: 30 * 1000,
  });
}
