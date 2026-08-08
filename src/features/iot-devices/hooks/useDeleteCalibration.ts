import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { iotDeviceService } from '../services/iot-device.service';

// GH-56 — delete a calibration. DELETE returns HTTP 200 + CommonResponse<object>;
// the interceptor already rejects when isSuccess=false, so onSuccess only runs when the delete truly succeeded (G1).
export function useDeleteCalibration(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (calibrationId: string) =>
      iotDeviceService.deleteCalibration(deviceId, calibrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.iotDevices });
    },
  });
}
