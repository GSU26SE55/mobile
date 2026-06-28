import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '../../../lib/queryKeys';
import { iotDeviceService } from '../services/iot-device.service';

// GH-56 — xoá calibration. DELETE trả HTTP 200 + CommonResponse<object>;
// interceptor đã reject nếu isSuccess=false nên onSuccess chỉ chạy khi xoá thật sự thành công (G1).
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
