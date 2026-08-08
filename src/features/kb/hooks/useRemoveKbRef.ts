import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { kbService } from '../services/kb.service';
import { handleErrorApi } from '@/src/lib/errors';

// GH-44 #6 — remove a KB reference from a ticket (soft delete). Invalidate the refs list.
export function useRemoveKbRef(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (referenceId: string) => kbService.removeReference(referenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.kb.related(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
