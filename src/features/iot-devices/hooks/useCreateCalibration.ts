import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { iotDeviceService } from '../services/iot-device.service';
import { CreateCalibrationPayload } from '../types/iot-device.types';

// GH-56 — tạo calibration cho device. Invalidate iotDevices → list calibration tự refresh.
export function useCreateCalibration(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCalibrationPayload) =>
      iotDeviceService.createCalibration(deviceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.iotDevices });
    },
  });
}
