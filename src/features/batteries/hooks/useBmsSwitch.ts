import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { bmsSwitchService } from '../services/bms-switch.service';

export function useBmsSwitch(assetId: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.bmsSwitch(assetId),
    queryFn: () => bmsSwitchService.getState(assetId).then((response) => response.data.data),
    enabled: !!assetId,
    staleTime: 0,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.pendingCommand ? 3_000 : 30_000,
  });
}
