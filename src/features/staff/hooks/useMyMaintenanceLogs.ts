import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';

// GH-44 #3 — Staff's personal maintenance history, grouped by ticket.
export function useMyMaintenanceLogs() {
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.myLogs(),
    queryFn: async () => {
      const res = await staffTicketService.getMyMaintenanceLogs();
      return res.data.data ?? [];
    },
    staleTime: 60 * 1000,
  });
}
