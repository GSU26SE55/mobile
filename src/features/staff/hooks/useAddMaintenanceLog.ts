import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { handleErrorApi } from '@/src/lib/errors';
import { MaintenanceLogPayload } from '../types/staff.types';

export function useAddMaintenanceLog(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MaintenanceLogPayload) => staffTicketService.addMaintenanceLog(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
