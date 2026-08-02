import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketService } from '../services/ticket.service';

export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.detail(id),
    queryFn: async () => {
      const res = await ticketService.getDetail(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}
