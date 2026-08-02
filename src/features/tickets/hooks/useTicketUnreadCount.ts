import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketChatActionsService } from '../services/ticketChatActions.service';

// GH-68 — số chat chưa đọc của ticket (per-ticket, BE không có bulk → chỉ dùng ở
// header chat detail, KHÔNG map trên ticket list item để tránh N+1).
export function useTicketUnreadCount(ticketId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId ?? ''),
    queryFn: async () => {
      const res = await ticketChatActionsService.getUnreadCount(ticketId!);
      // data là số thuần từ CommonResponse<int>. Trước đây đọc `.unreadCount`
      // trên một number → luôn undefined → badge vĩnh viễn 0.
      return res.data.data ?? 0;
    },
    enabled: !!ticketId,
    // staleTime 0: mark-read và realtime chủ động invalidate key này, không cần
    // giữ cache 30s (giữ lại thì badge treo số cũ sau khi đã đọc).
    staleTime: 0,
  });
}
