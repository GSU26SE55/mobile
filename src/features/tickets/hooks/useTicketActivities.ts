import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketService } from '../services/ticket.service';

// GH-44 #2 — timeline ticket. BE trả full array (không pagination), đã sort mới→cũ.
export function useTicketActivities(ticketId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.activities(ticketId ?? ''),
    queryFn: async () => {
      const res = await ticketService.getActivities(ticketId!);
      return res.data.data ?? [];
    },
    enabled: !!ticketId,
    staleTime: 30 * 1000,
  });
}
