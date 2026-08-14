import { useQuery } from '@tanstack/react-query';
import { useIsFocusedSafe } from '@/src/hooks/useIsFocusedSafe';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketService } from '../services/ticket.service';
import { detailRefetchInterval } from '../utils/ticketWorkflow';

export function useTicketDetail(id: string) {
  const isFocused = useIsFocusedSafe();
  return useQuery({
    queryKey: QUERY_KEY.tickets.detail(id),
    queryFn: async () => {
      const res = await ticketService.getDetail(id);
      return res.data.data;
    },
    enabled: !!id,
    refetchInterval: query => isFocused ? detailRefetchInterval(query.state.data ?? undefined) : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
