// GH-56 — IoT Device + Calibration. Mirror docs/api-battery.md §11B + §by-code (dòng 2051–2128).
import type { IotDeviceStatusEnum } from '../enums/iot-device.enum';
export { IotDeviceStatusEnum } from '../enums/iot-device.enum';

// Trả từ GET /api/iot-devices/by-code/{deviceCode} (subset cần dùng).
// L2: giữ siteId (doc dòng 2161: string, không nullable) cho đúng contract.
export interface IotDeviceDto {
  id: string; // GUID — dùng cho các route calibration
  deviceCode: string;
  displayName: string;
  status: IotDeviceStatusEnum;
  siteId: string;
  siteName: string | null;
}

export interface IotDeviceCalibrationDto {
  id: string;
  iotDeviceId: string;
  channel: string; // voltage/current/temperature/soc
  batteryAssetId: string | null; // null = device-level
  scale: number;
  offset: number;
  unit: string; // V/A/°C/%
  calibratedAt: string; // ISO UTC
  expiresAt: string | null;
  notes: string | null;
  createdAt: string; // ISO UTC
}

// Body POST /api/iot-devices/{deviceId}/calibrations
export interface CreateCalibrationPayload {
  channel: string;
  batteryAssetId?: string | null; // null = cấp device
  scale: number; // default 1 (prefill form)
  offset: number; // default 0 (prefill form)
  unit: string;
  calibratedAt: string; // ISO UTC
  expiresAt?: string | null;
  notes?: string | null;
}

// Query GET calibrations
export interface CalibrationListParams {
  channel?: string; // filter case-insensitive
  includeExpired?: boolean; // mặc định false
}
