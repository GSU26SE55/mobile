// GH-56 — IoT Device + Calibration. Mirror docs/api-battery.md §11B + §by-code (lines 2051–2128).
import type { IotDeviceStatusEnum } from '../enums/iot-device.enum';
export { IotDeviceStatusEnum } from '../enums/iot-device.enum';

// Returned by GET /api/iot-devices/by-code/{deviceCode} (subset needed here).
// L2: keep siteId (doc line 2161: string, non-nullable) to match the contract.
export interface IotDeviceDto {
  id: string; // GUID — used for calibration routes
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
  batteryAssetId?: string | null; // null = device-level
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
  includeExpired?: boolean; // default false
}
