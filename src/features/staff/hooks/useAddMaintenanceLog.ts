import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { MaintenanceLogPayload } from '../types/staff.types';

// Has fields the BE can reject (Summary, DurationMinutes, StartedAt) — the component uses
// mutateAsync + try/catch + handleErrorApi({ error, setFieldError }) so an EntityError maps
// to the right field.
export function useAddMaintenanceLog(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MaintenanceLogPayload) => staffTicketService.addMaintenanceLog(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
    },
  });
}
