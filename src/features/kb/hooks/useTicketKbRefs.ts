import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { kbService } from '../services/kb.service';

export function useTicketKbRefs(ticketId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.kb.related(ticketId ?? ''),
    queryFn: async () => {
      if (!ticketId) return [];
      const res = await kbService.getTicketRefs(ticketId);
      return res.data.data ?? [];
    },
    enabled: !!ticketId,
    staleTime: 2 * 60 * 1000,
  });
}
