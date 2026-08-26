import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { ticketService } from '../services/ticket.service';
import { useIsFocusedSafe } from '@/src/hooks/useIsFocusedSafe';
import type { TicketStatusEnum } from '../types/ticket.types';
import { ACTIVE_TICKET_STATUSES } from '../utils/ticketWorkflow';

// GH-44 #2 — ticket timeline. BE returns the full array (no pagination), already sorted newest→oldest.
//
// `status` is optional so the many existing call sites keep working unchanged; passing it turns on
// 15s polling while the ticket is active and the screen is focused — matches useTicketDetail's
// fastest tier so the two stay in sync (e.g. an Escalated ticket's timeline updates alongside its badge).
export function useTicketActivities(ticketId: string | undefined, status?: TicketStatusEnum) {
  const isFocused = useIsFocusedSafe();
  const shouldPoll = !!status && ACTIVE_TICKET_STATUSES.includes(status);
  return useQuery({
    queryKey: QUERY_KEY.tickets.activities(ticketId ?? ''),
    queryFn: async () => {
      const res = await ticketService.getActivities(ticketId!);
      return res.data.data ?? [];
    },
    enabled: !!ticketId,
    staleTime: 30 * 1000,
    refetchInterval: isFocused && shouldPoll ? 15_000 : false,
    refetchIntervalInBackground: false,
  });
}
