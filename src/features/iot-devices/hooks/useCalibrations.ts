import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { iotDeviceService } from '../services/iot-device.service';
import { CalibrationListParams } from '../types/iot-device.types';

// GH-56 — list calibrations for a device (flat, sorted by calibratedAt DESC from BE).
// enabled once deviceId is available (resolved from by-code).
export function useCalibrations(deviceId: string | undefined, params?: CalibrationListParams) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.calibrations(
      deviceId ?? '',
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () =>
      iotDeviceService.getCalibrations(deviceId as string, params).then((r) => r.data.data),
    enabled: !!deviceId,
  });
}
