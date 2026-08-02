import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { ticketChatActionsService } from '../services/ticketChatActions.service';

/**
 * Ai đã đọc 1 chat — GET /api/tickets/{tid}/chats/{cid}/readers.
 *
 * ⚠️ BE giới hạn `[Authorize(Roles = "Staff,Manager,Admin")]` — Customer gọi sẽ
 * nhận 403. CHỈ dùng ở màn Staff, không wire vào (customer)/tickets/[id].tsx.
 *
 * `enabled` mặc định false: chỉ fetch khi user chủ động mở danh sách người đọc,
 * tránh N+1 request khi thread có nhiều chat.
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
