import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketChatActionsService } from '../services/ticketChatActions.service';

/**
 * Who has read a chat — GET /api/tickets/{tid}/chats/{cid}/readers.
 *
 * Warning: BE restricts with `[Authorize(Roles = "Staff,Manager,Admin")]` — Customer calls
 * get a 403. ONLY use on Staff screens, do not wire into (customer)/tickets/[id].tsx.
 *
 * `enabled` defaults to false: only fetch when the user actively opens the readers list,
 * to avoid N+1 requests when a thread has many chats.
 */
export function useChatReaders(
  ticketId: string | undefined,
  chatId: string | undefined,
  enabled = false,
) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.chatReaders(ticketId ?? '', chatId ?? ''),
    queryFn: async () => {
      const res = await ticketChatActionsService.getReaders(ticketId!, chatId!);
      return res.data.data ?? [];
    },
    enabled: enabled && !!ticketId && !!chatId,
    staleTime: 30_000,
  });
}
