import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { incidentService } from '../services/incident.service';

// Staff — Open → Acknowledged. 409 nếu state ≠ Open.
// Invalidate toàn bộ incident queries → list + detail tự refresh.
export function useAcknowledgeIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => incidentService.acknowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.incidents });
    },
  });
}
