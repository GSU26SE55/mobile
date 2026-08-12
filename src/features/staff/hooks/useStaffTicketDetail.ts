import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { detailRefetchInterval } from '../../tickets/utils/ticketWorkflow';

export function useStaffTicketDetail(id: string) {
  const isFocused = useIsFocused();
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.detail(id),
    queryFn: async () => {
      const res = await staffTicketService.getDetail(id);
      return res.data.data;
    },
    enabled: !!id,
    refetchInterval: query => isFocused ? detailRefetchInterval(query.state.data ?? undefined) : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
