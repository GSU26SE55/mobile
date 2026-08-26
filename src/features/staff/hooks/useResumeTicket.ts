import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateTicketLifecycle } from '../../tickets/utils/invalidateTicketLifecycle';
import { staffTicketService } from '../services/staffTicket.service';
import { ResumePayload } from '../types/staff.types';

// Has a field the BE can reject (Reason) — the component uses mutateAsync + try/catch +
// handleErrorApi({ error, setFieldError }) so an EntityError maps to the right field.
export function useResumeTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ResumePayload) => staffTicketService.resume(ticketId, data),
    onSuccess: () => {
      invalidateTicketLifecycle(queryClient, ticketId);
    },
  });
}
