import { handleErrorApi } from '@/src/lib/errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { incidentService } from '../services/incident.service';

// Staff — Open → Acknowledged. 409 if state ≠ Open.
// Invalidate all incident queries → list + detail auto-refresh.
export function useAcknowledgeIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => incidentService.acknowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.incidents });
    },
    // Không có onError thì mutation hỏng là im lặng hoàn toàn — user bấm nút, không
    // thấy gì, tưởng nút hỏng. handleErrorApi hiện Alert cho lỗi HTTP.
    onError: (error: unknown) => handleErrorApi({ error }),
  });
}
