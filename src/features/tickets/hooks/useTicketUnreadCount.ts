import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketChatActionsService } from '../services/ticketChatActions.service';

// GH-68 — unread chat count for the ticket (per-ticket, BE has no bulk endpoint → only used
// in the chat detail header, do NOT map it on ticket list items to avoid N+1).
export function useTicketUnreadCount(ticketId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId ?? ''),
    queryFn: async () => {
      const res = await ticketChatActionsService.getUnreadCount(ticketId!);
      // data is a plain number from CommonResponse<int>. Previously read `.unreadCount`
      // on a number → always undefined → badge permanently stuck at 0.
      return res.data.data ?? 0;
    },
    enabled: !!ticketId,
    // staleTime 0: mark-read and realtime actively invalidate this key, no need to
    // keep a 30s cache (keeping it would leave the badge stuck at the old count after reading).
    staleTime: 0,
  });
}
