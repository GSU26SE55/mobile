import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketService } from '../services/ticket.service';
import { TicketListParams } from '../types/ticket.types';

export function useTickets(params?: TicketListParams, options?: { enabled?: boolean }) {
  const isFocused = useIsFocused();
  return useQuery({
    queryKey: QUERY_KEY.tickets.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await ticketService.getList(params);
      return res.data.data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: query => isFocused && query.state.data?.items?.some(t => ['Pending', 'InProgress', 'Request', 'ReAssign', 'Completed'].includes(t.status)) ? 60_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
