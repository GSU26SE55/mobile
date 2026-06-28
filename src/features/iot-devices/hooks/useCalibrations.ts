import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { iotDeviceService } from '../services/iot-device.service';
import { CalibrationListParams } from '../types/iot-device.types';

// GH-56 — list calibration của 1 device (flat, sort calibratedAt DESC từ BE).
// enabled khi đã có deviceId (resolve từ by-code).
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
