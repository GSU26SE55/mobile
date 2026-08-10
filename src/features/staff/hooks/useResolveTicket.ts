import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { staffTicketService } from '../services/staffTicket.service';
import { ResolvePayload } from '../types/staff.types';

// Has a field the BE can reject (ResolutionSummary) — the component uses mutateAsync +
// try/catch + handleErrorApi({ error, setFieldError }) so an EntityError maps to the right field.
export function useResolveTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ResolvePayload) => staffTicketService.resolve(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
    },
  });
}
