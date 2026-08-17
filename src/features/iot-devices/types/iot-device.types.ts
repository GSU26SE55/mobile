// GH-56 — IoT Device + Calibration. Mirror docs/api-battery.md §11B + §by-code (lines 2051–2128).
import type { IotDeviceStatusEnum } from '../enums/iot-device.enum';
export { IotDeviceStatusEnum } from '../enums/iot-device.enum';

/**
 * Returned by `GET /api/iot-devices/by-code/{deviceCode}` and `GET /api/iot-devices` (IOT3-57).
 *
 * IOT3-60 — adds nine fields already returned by the API since IoT-2 but missing from this type.
 * This only aligns the client type with the existing wire contract; no backend change is needed.
 *
 * These fields expose the device's last-seen time, firmware state, and clock skew so the client
 * can report device health instead of only confirming that the device exists.
 */
export interface IotDeviceDto {
  id: string; // GUID — used for calibration routes
  deviceCode: string;
  displayName: string;
  status: IotDeviceStatusEnum;
  siteId: string;
  siteName: string | null;

  // ---- IOT3-60 ----
  /** Lần cuối backend nhận được tín hiệu. `null` = chưa từng lên mạng. */
  lastSeenAt: string | null;
  /** Lần cuối gọi `/provision` thành công. */
  lastProvisionedAt: string | null;
  /** Lần cuối bị đánh dấu mất kết nối. */
  lastOfflineAt: string | null;
  /** Firmware thiết bị tự khai trong heartbeat. */
  currentFirmwareVersion: string | null;
  /** Firmware admin muốn thiết bị nâng lên. Khác `currentFirmwareVersion` ⇒ đang chờ OTA. */
  targetFirmwareVersion: string | null;
  /** Chu kỳ heartbeat (giây) — dùng để biết bao lâu không thấy thì đáng lo. */
  heartbeatIntervalSeconds: number;
  /**
   * Lệch đồng hồ thiết bị so với máy chủ (giây).
   * Vượt ±300 là backend TỪ CHỐI provision — giải thích được vì sao một thiết bị "im lặng"
   * mà không hề có lỗi mạng.
   */
  lastClockSkewSeconds: number | null;
  /** 4 ký tự cuối API key — đối chiếu nhanh với nhãn dán trên thân máy. */
  apiKeyLastFour: string | null;
  /** Đời phần cứng (vd "v1.0"). */
  hardwareRevision: string | null;
}

/**
 * IOT3-58 — một mẫu heartbeat. Nguồn: `GET /api/iot-devices/{id}/heartbeats`.
 */
export interface IotDeviceHeartbeatDto {
  time: string; // ISO UTC
  firmwareVersion: string | null;
  /** Sóng WiFi (dBm). Luôn ÂM: −50 mạnh, −90 gần như không dùng được. */
  rssiDbm: number | null;
  freeMemoryPercent: number | null;
  uptimeSeconds: number | null;
  /** Bản ghi còn kẹt trong hàng đợi cục bộ vì chưa đẩy lên được. */
  queuedReadingCount: number | null;
  deviceTimestamp: string | null;
  clockSkewSeconds: number | null;
}

/**
 * IOT3-58 — trang heartbeat, phân trang theo CON TRỎ (không offset).
 * `totalCount` luôn `null` cho dữ liệu chuỗi thời gian — dùng `hasMore`.
 */
export interface IotDeviceHeartbeatListDto {
  items: IotDeviceHeartbeatDto[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number | null;
}

/** IOT3-57 — tham số lọc danh sách thiết bị. */
export interface IotDeviceListParams {
  pageNumber?: number;
  pageSize?: number;
  siteId?: string;
  status?: IotDeviceStatusEnum;
  keyword?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

/** IOT3-58 — tham số truy vấn heartbeat. */
export interface HeartbeatListParams {
  from?: string;
  to?: string;
  limit?: number;
  /** `nextCursor` của trang trước. */
  cursor?: string;
}

export interface IotDeviceCalibrationDto {
  id: string;
  iotDeviceId: string;
  channel: string; // voltage/current/temperature/soc
  batteryAssetId: string | null;
  // Human-readable serial for `batteryAssetId`. Null for device-level calibrations (no battery
  // attached) or when the asset row is gone — show the id in that case, never a blank line.
  batterySerialNumber: string | null; // null = device-level
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
