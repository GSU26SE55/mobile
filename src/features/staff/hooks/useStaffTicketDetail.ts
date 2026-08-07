import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';

export function useStaffTicketDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.detail(id),
    queryFn: async () => {
      const res = await staffTicketService.getDetail(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}
