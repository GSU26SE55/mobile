import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { alertService } from '../services/alert.service';

// Customer ack alert của mình (Open → Acknowledged). 409 nếu Resolved/Merged.
// Invalidate toàn bộ alert queries → list + detail + dashboard count tự refresh.
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertService.acknowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.alerts });
    },
  });
}
