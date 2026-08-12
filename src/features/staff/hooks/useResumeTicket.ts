import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateTicketLifecycle } from '../../tickets/utils/invalidateTicketLifecycle';
import { staffTicketService } from '../services/staffTicket.service';
import { handleErrorApi } from '@/src/lib/errors';
import { ResumePayload } from '../types/staff.types';

export function useResumeTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ResumePayload) => staffTicketService.resume(ticketId, data),
    onSuccess: () => {
      invalidateTicketLifecycle(queryClient, ticketId);
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
