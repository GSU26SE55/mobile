import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { handleErrorApi } from '@/src/lib/errors';
import { KEY, QUERY_KEY } from '@/src/lib/queryKeys';
import { iotDeviceService } from '../services/iot-device.service';

/**
 * Full device detail (apiKey/QR/MQTT) for the "View details" quick action.
 *
 * `staleTime: 0` — these are security-sensitive secrets that can be rotated from ANOTHER
 * client (e.g. the web app). Without this, the default 2-minute staleTime lets a Staff member
 * open "View details" right after a web rotate and still see the old key from cache.
 */
export function useIotDeviceDetail(deviceId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.detail(deviceId ?? ''),
    queryFn: () => iotDeviceService.getById(deviceId as string).then((r) => r.data.data),
    enabled: !!deviceId,
    staleTime: 0,
  });
}

export function useRotateIotDeviceKey(deviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => iotDeviceService.rotateKey(deviceId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.iotDevices.detail(deviceId) });
      qc.invalidateQueries({ queryKey: KEY.iotDevices });
    },
    // Không có onError thì mutation hỏng là im lặng — user bấm nút, không thấy gì,
    // tưởng nút hỏng. handleErrorApi hiện Alert.
    onError: (error: unknown) => handleErrorApi({ error }),
  });
}

export function useRotateIotDeviceMqtt(deviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => iotDeviceService.rotateMqtt(deviceId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.iotDevices.detail(deviceId) });
      qc.invalidateQueries({ queryKey: KEY.iotDevices });
    },
    // Không có onError thì mutation hỏng là im lặng — user bấm nút, không thấy gì,
    // tưởng nút hỏng. handleErrorApi hiện Alert.
    onError: (error: unknown) => handleErrorApi({ error }),
  });
}
