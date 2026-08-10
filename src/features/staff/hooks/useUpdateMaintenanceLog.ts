import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { UpdateMaintenanceLogPayload } from '../types/staff.types';

interface UpdateLogParams {
  logId: string;
  data: UpdateMaintenanceLogPayload;
}

// GH-44 #4 — PATCH partial update maintenance log (log owner only).
// Has fields the BE can reject (Summary, DurationMinutes, StartedAt) — the component uses
// mutateAsync + try/catch + handleErrorApi({ error, setFieldError }) so an EntityError maps
// to the right field.
export function useUpdateMaintenanceLog(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ logId, data }: UpdateLogParams) =>
      staffTicketService.updateMaintenanceLog(ticketId, logId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.staffTickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.staffTickets.myLogs() });
    },
  });
}
