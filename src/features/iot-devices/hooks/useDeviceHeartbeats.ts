import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { iotDeviceService } from '../services/iot-device.service';
import { HeartbeatListParams } from '../types/iot-device.types';

/**
 * IOT3-63 — lịch sử heartbeat của một thiết bị.
 *
 * Chỉ lấy TRANG ĐẦU. Màn hình chi tiết cần trả lời "thiết bị này có khoẻ không" — vài chục mẫu
 * gần nhất là đủ; cuộn vô hạn qua hàng triệu bản ghi không phục vụ câu hỏi đó và sẽ ngốn RAM
 * trên máy cấu hình thấp.
 */
export function useDeviceHeartbeats(deviceId: string | undefined, params?: HeartbeatListParams) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.heartbeats(deviceId ?? '', params ?? {}),
    queryFn: () =>
      iotDeviceService.getHeartbeats(deviceId as string, params).then((r) => r.data.data),
    enabled: !!deviceId,
    staleTime: 30_000,
  });
}
