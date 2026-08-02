import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { handleErrorApi } from '@/src/lib/errors';
import { HoldPayload } from '../types/staff.types';

export function useHoldTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HoldPayload) => staffTicketService.hold(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
