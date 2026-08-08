import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { alertService } from '../services/alert.service';

// Customer acknowledges their own alert (Open → Acknowledged). 409 if Resolved/Merged.
// Invalidates all alert queries → list + detail + dashboard count auto-refresh.
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertService.acknowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.alerts });
    },
  });
}
