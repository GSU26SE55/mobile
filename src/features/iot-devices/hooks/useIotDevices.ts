import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { iotDeviceService } from '../services/iot-device.service';
import { IotDeviceListParams } from '../types/iot-device.types';

/**
 * IOT3-62 — danh sách thiết bị IoT cho Staff.
 *
 * `staleTime` 30 giây: trạng thái thiết bị đổi theo nhịp heartbeat (mặc định 60 s), nên làm mới
 * dày hơn thế chỉ tốn request mà không có số liệu mới.
 */
export function useIotDevices(params?: IotDeviceListParams) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.list(params ?? {}),
    queryFn: () => iotDeviceService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
  });
}
