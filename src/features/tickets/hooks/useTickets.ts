import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketService } from '../services/ticket.service';
import { TicketListParams } from '../types/ticket.types';

export function useTickets(params?: TicketListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await ticketService.getList(params);
      return res.data.data;
    },
    enabled: options?.enabled ?? true,
  });
}
