import { useQuery } from '@tanstack/react-query';
import { useIsFocusedSafe } from '@/src/hooks/useIsFocusedSafe';
import { useRefetchOnFocus } from '@/src/hooks/useRefetchOnFocus';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { StaffTicketListParams } from '../types/staff.types';

export function useStaffTickets(params?: StaffTicketListParams, options?: { enabled?: boolean }) {
  const isFocused = useIsFocusedSafe();
  const query = useQuery({
    queryKey: QUERY_KEY.staffTickets.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await staffTicketService.getMyTickets(params);
      return res.data.data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: q => isFocused && q.state.data?.items?.some(t => ['Pending', 'InProgress', 'Request', 'ReAssign', 'Completed'].includes(t.status)) ? 60_000 : false,
    refetchIntervalInBackground: false,
    // refetchOnWindowFocus targets the browser `window.focus` event — never fires on RN.
    refetchOnWindowFocus: false,
  });
  useRefetchOnFocus(isFocused, query);
  return query;
}
