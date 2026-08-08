import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import {
  IotDeviceDto,
  IotDeviceCalibrationDto,
  CreateCalibrationPayload,
  CalibrationListParams,
} from '../types/iot-device.types';

// GH-56 — IoT device lookup + calibration (Staff).
export const iotDeviceService = {
  // Bridges deviceCode → deviceId (GUID). 404 if no match.
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

  // G1: DELETE returns HTTP 200 + CommonResponse<object> → caller checks isSuccess, does NOT check 204.
  deleteCalibration: (deviceId: string, calibrationId: string) =>
    axiosInstance.delete<CommonResponse<object>>(
      ENDPOINTS.IOT_DEVICES.CALIBRATION_ITEM(deviceId, calibrationId),
    ),
};
