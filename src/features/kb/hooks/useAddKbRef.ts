import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { kbService } from '../services/kb.service';
import { handleErrorApi } from '@/src/lib/errors';
import { AddKbReferencePayload } from '../types/kb.types';

// GH-44 #5 — gán bài KB vào ticket. Invalidate danh sách refs (kb.related).
export function useAddKbRef(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddKbReferencePayload) => kbService.addReference(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.kb.related(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
