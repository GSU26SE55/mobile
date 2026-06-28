import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  IotDeviceDto,
  IotDeviceCalibrationDto,
  CreateCalibrationPayload,
  CalibrationListParams,
} from '../types/iot-device.types';

// GH-56 — IoT device lookup + calibration (Staff).
export const iotDeviceService = {
  // Cầu nối deviceCode → deviceId (GUID). 404 nếu không khớp.
  getByCode: (deviceCode: string) =>
    axiosInstance.get<CommonResponse<IotDeviceDto>>(ENDPOINTS.IOT_DEVICES.BY_CODE(deviceCode)),

  getCalibrations: (deviceId: string, params?: CalibrationListParams) =>
    axiosInstance.get<CommonResponse<IotDeviceCalibrationDto[]>>(
      ENDPOINTS.IOT_DEVICES.CALIBRATIONS(deviceId),
      { params },
    ),

  createCalibration: (deviceId: string, payload: CreateCalibrationPayload) =>
    axiosInstance.post<CommonResponse<IotDeviceCalibrationDto>>(
      ENDPOINTS.IOT_DEVICES.CALIBRATIONS(deviceId),
      payload,
    ),

  // G1: DELETE trả HTTP 200 + CommonResponse<object> → caller check isSuccess, KHÔNG check 204.
  deleteCalibration: (deviceId: string, calibrationId: string) =>
    axiosInstance.delete<CommonResponse<object>>(
      ENDPOINTS.IOT_DEVICES.CALIBRATION_ITEM(deviceId, calibrationId),
    ),
};
