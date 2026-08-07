import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { StaffTicketListParams } from '../types/staff.types';

export function useStaffTickets(params?: StaffTicketListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await staffTicketService.getMyTickets(params);
      return res.data.data;
    },
    enabled: options?.enabled ?? true,
  });
}
