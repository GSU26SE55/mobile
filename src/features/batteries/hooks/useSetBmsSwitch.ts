import { handleErrorApi } from '@/src/lib/errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { bmsSwitchService } from '../services/bms-switch.service';
import type { SetBmsSwitchPayload } from '../types/bms-switch.types';

export function useSetBmsSwitch(assetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetBmsSwitchPayload) =>
      bmsSwitchService.setSwitch(assetId, payload).then((response) => response.data.data!),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.batteryAssets.bmsSwitch(assetId),
      }),
    // Không có onError thì mutation hỏng là im lặng hoàn toàn — user bấm nút, không
    // thấy gì, tưởng nút hỏng. handleErrorApi hiện Alert cho lỗi HTTP.
    onError: (error: unknown) => handleErrorApi({ error }),
  });
}
