import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateTicketLifecycle } from '../utils/invalidateTicketLifecycle';
import { ticketService } from '../services/ticket.service';
import type { SchedulePeriodicMaintenancePayload } from '../types/ticket.types';

export function useSchedulePeriodicMaintenance(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SchedulePeriodicMaintenancePayload) =>
      ticketService.schedulePeriodicMaintenance(ticketId, data),
    onSuccess: () => {
      // Refresh selected schedule, scheduleVersion, list cards and the newly logged activity.
      invalidateTicketLifecycle(queryClient, ticketId);
    },
  });
}
