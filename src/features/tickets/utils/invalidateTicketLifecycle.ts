import type { QueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '@/src/lib/queryKeys';

/** Reconcile every cache surface affected by a ticket lifecycle mutation. */
export function invalidateTicketLifecycle(queryClient: QueryClient, ticketId: string) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.detail(ticketId) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEY.staffTickets.detail(ticketId) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.activities(ticketId) });
  queryClient.invalidateQueries({ queryKey: KEY.tickets });
  queryClient.invalidateQueries({ queryKey: KEY.staffTickets });
}
