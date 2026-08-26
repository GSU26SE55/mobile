import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { iotDeviceService } from '../services/iot-device.service';

// GH-56 — resolve deviceCode → IotDeviceDto (includes the GUID id). enabled once Staff has submitted the code.
// retry: false because a 404 (not found) shouldn't be retried.
export function useDeviceByCode(deviceCode: string, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.byCode(deviceCode),
    queryFn: () => iotDeviceService.getByCode(deviceCode).then((r) => r.data.data),
    enabled: enabled && !!deviceCode,
    retry: false,
  });
}
