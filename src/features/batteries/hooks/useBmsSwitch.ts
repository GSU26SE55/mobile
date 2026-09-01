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
    // Command lifecycle: MQTT to the device, Modbus write and readback in firmware
    // (~200-400ms), then an ack returns. Polling every 3s made the control look slow
    // long after the BMS had already applied the state.
    refetchInterval: (query) =>
      query.state.data?.pendingCommand ? 400 : 30_000,
  });
}
