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
  });
}
