import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { StaffTicketListParams } from '../types/staff.types';

export function useStaffTickets(params?: StaffTicketListParams, options?: { enabled?: boolean }) {
  const isFocused = useIsFocused();
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await staffTicketService.getMyTickets(params);
      return res.data.data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: query => isFocused && query.state.data?.items?.some(t => ['Pending', 'InProgress', 'Request', 'ReAssign', 'Completed'].includes(t.status)) ? 60_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
