import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { ticketChatActionsService } from '../services/ticketChatActions.service';

// GH-68 — số chat chưa đọc của ticket (per-ticket, BE không có bulk → chỉ dùng ở
// header chat detail, KHÔNG map trên ticket list item để tránh N+1).
export function useTicketUnreadCount(ticketId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId ?? ''),
    queryFn: async () => {
      const res = await ticketChatActionsService.getUnreadCount(ticketId!);
      return res.data.data?.unreadCount ?? 0;
    },
    enabled: !!ticketId,
    staleTime: 30 * 1000,
  });
}
