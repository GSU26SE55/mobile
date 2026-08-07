import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { kbService } from '../services/kb.service';
import { handleErrorApi } from '@/src/lib/errors';

// GH-44 #6 — gỡ tham chiếu KB khỏi ticket (soft delete). Invalidate danh sách refs.
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
