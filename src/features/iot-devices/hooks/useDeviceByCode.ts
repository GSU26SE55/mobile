import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { iotDeviceService } from '../services/iot-device.service';

// GH-56 — resolve deviceCode → IotDeviceDto (gồm id GUID). enabled khi Staff đã submit code.
// retry: false vì 404 (không tìm thấy) không nên thử lại.
export function useDeviceByCode(deviceCode: string, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.byCode(deviceCode),
    queryFn: () => iotDeviceService.getByCode(deviceCode).then((r) => r.data.data),
    enabled: enabled && !!deviceCode,
    retry: false,
  });
}
