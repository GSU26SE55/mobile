import { handleErrorApi } from '@/src/lib/errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { alertService } from '../services/alert.service';

// GH-55 — Staff resolves an alert (Open/Acknowledged → Resolved). 409 if Merged.
// Invalidates all alert queries → list + detail + dashboard count auto-refresh.
export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertService.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.alerts });
    },
    // Không có onError thì mutation hỏng là im lặng hoàn toàn — user bấm nút, không
    // thấy gì, tưởng nút hỏng. handleErrorApi hiện Alert cho lỗi HTTP.
    onError: (error: unknown) => handleErrorApi({ error }),
  });
}
