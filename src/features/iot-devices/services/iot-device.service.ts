import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import {
  IotDeviceDto,
  IotDeviceDetailDto,
  IotDeviceCreatedDto,
  IotDeviceCalibrationDto,
  CreateCalibrationPayload,
  CalibrationListParams,
  IotDeviceListParams,
  IotDeviceHeartbeatListDto,
  HeartbeatListParams,
} from '../types/iot-device.types';

// GH-56 — IoT device lookup + calibration (Staff).
export const iotDeviceService = {
  // Bridges deviceCode → deviceId (GUID). 404 if no match.
  getByCode: (deviceCode: string) =>
    axiosInstance.get<CommonResponse<IotDeviceDto>>(ENDPOINTS.IOT_DEVICES.BY_CODE(deviceCode)),

  // IOT3-57 — danh sách thiết bị. Backend KHÔNG lọc theo site của người gọi (quyết định #7):
  // Staff hay bị điều sang site khác giữa ca, chặn theo site là chặn đúng lúc cần nhất.
  getList: (params?: IotDeviceListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<IotDeviceDto>>>(
      ENDPOINTS.IOT_DEVICES.LIST,
      { params },
    ),

  // IOT3-58 — lịch sử heartbeat. Con trỏ, không offset: đây là hypertable hàng triệu dòng.
  getHeartbeats: (deviceId: string, params?: HeartbeatListParams) =>
    axiosInstance.get<CommonResponse<IotDeviceHeartbeatListDto>>(
      ENDPOINTS.IOT_DEVICES.HEARTBEATS(deviceId),
      { params },
    ),

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

  // Admin route opened to Staff — full apiKey/QR/MQTT, re-readable any time ("View details").
  getById: (deviceId: string) =>
    axiosInstance.get<CommonResponse<IotDeviceDetailDto>>(
      ENDPOINTS.IOT_DEVICES.ADMIN_DETAIL(deviceId),
    ),

  rotateKey: (deviceId: string) =>
    axiosInstance.post<CommonResponse<IotDeviceCreatedDto>>(
      ENDPOINTS.IOT_DEVICES.ROTATE_KEY(deviceId),
    ),

  // Only the MQTT username/password change — apiKey stays the same, so the device self-heals
  // via /provision, no site visit needed. See web's IOT3-76 note for the full explanation.
  rotateMqtt: (deviceId: string) =>
    axiosInstance.post<CommonResponse<IotDeviceCreatedDto>>(
      ENDPOINTS.IOT_DEVICES.ROTATE_MQTT(deviceId),
    ),
};
