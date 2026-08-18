import { useQuery } from '@tanstack/react-query';
import { useIsFocusedSafe } from '@/src/hooks/useIsFocusedSafe';
import { useRefetchOnFocus } from '@/src/hooks/useRefetchOnFocus';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketService } from '../services/ticket.service';
import { detailRefetchInterval } from '../utils/ticketWorkflow';

export function useTicketDetail(id: string) {
  const isFocused = useIsFocusedSafe();
  const query = useQuery({
    queryKey: QUERY_KEY.tickets.detail(id),
    queryFn: async () => {
      const res = await ticketService.getDetail(id);
      return res.data.data;
    },
    enabled: !!id,
    refetchInterval: q => isFocused ? detailRefetchInterval(q.state.data ?? undefined) : false,
    refetchIntervalInBackground: false,
    // refetchOnWindowFocus targets the browser `window.focus` event — never fires on RN.
    refetchOnWindowFocus: false,
  });
  useRefetchOnFocus(isFocused, query);
  return query;
}
