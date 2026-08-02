import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';

// GH-67 — KPI snapshot cho Staff dashboard. Snapshot nên cache ~1 phút (không auto-refetch).
export function useStaffDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.dashboardStats(),
    queryFn: async () => {
      const res = await staffTicketService.getDashboardStats();
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}
