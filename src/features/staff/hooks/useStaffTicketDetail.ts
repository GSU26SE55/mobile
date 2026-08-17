import { useQuery } from '@tanstack/react-query';
import { useIsFocusedSafe } from '@/src/hooks/useIsFocusedSafe';
import { useRefetchOnFocus } from '@/src/hooks/useRefetchOnFocus';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { detailRefetchInterval } from '../../tickets/utils/ticketWorkflow';

export function useStaffTicketDetail(id: string) {
  const isFocused = useIsFocusedSafe();
  const query = useQuery({
    queryKey: QUERY_KEY.staffTickets.detail(id),
    queryFn: async () => {
      const res = await staffTicketService.getDetail(id);
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
