import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { handleErrorApi } from '@/src/lib/errors';
import { UpdateMaintenanceLogPayload } from '../types/staff.types';

interface UpdateLogParams {
  logId: string;
  data: UpdateMaintenanceLogPayload;
}

// GH-44 #4 — PATCH partial update maintenance log (log owner only).
export function useUpdateMaintenanceLog(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ logId, data }: UpdateLogParams) =>
      staffTicketService.updateMaintenanceLog(ticketId, logId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.staffTickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.staffTickets.myLogs() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
