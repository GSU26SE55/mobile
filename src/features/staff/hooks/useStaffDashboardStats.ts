import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';

// GH-67 — KPI snapshot for the Staff dashboard. The snapshot should cache for ~1 minute (no auto-refetch).
export function useStaffDashboardStats() {
  const isFocused = useIsFocused();
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.dashboardStats(),
    queryFn: async () => {
      const res = await staffTicketService.getDashboardStats();
      return res.data.data;
    },
    staleTime: 60 * 1000,
    refetchInterval: isFocused ? 60 * 1000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
