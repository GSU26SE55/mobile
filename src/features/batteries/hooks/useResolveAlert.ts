import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { alertService } from '../services/alert.service';

// GH-55 — Staff resolve alert (Open/Acknowledged → Resolved). 409 nếu Merged.
// Invalidate toàn bộ alert queries → list + detail + dashboard count tự refresh.
export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertService.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.alerts });
    },
  });
}
