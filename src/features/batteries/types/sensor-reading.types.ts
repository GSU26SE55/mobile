// Sensor Readings — time-series (TimescaleDB). KHÔNG extend AuditableEntity.
// Mirror docs/api-battery.md §Nhóm 4.

export interface SensorReadingDto {
  time: string; // ISO 8601 UTC — partition key TimescaleDB
  batteryAssetId: string;
  voltage: number; // V
  current: number; // A — âm = đang xả
  temperature: number; // °C
  socPercent: number; // 0–100
  cycleCount: number | null;
  sourceDeviceId: string | null;
}

export interface SensorReadingHistoryParams {
  from?: string; // UTC
  to?: string; // UTC
  limit?: number; // 1–1000, default 100
  cursor?: string; // timestamp record cuối trang trước; BE lấy record có time < cursor
}

// Cursor pagination — KHÔNG có totalItems (time-series).
export interface SensorReadingHistoryResponseDto {
  items: SensorReadingDto[]; // sort time giảm dần
  nextCursor: string | null; // null nếu hết data
  hasMore: boolean;
}

export type SensorReadingInterval = '1m' | '5m' | '15m' | '1h' | '1d';

export interface SensorReadingAggregateParams {
  from?: string; // UTC
  to?: string; // UTC
  interval?: SensorReadingInterval; // default "1h"
}

export interface SensorReadingAggregateDto {
  time: string; // điểm bắt đầu bucket (UTC) — field "time", không phải "bucket"
  avgVoltage: number;
  avgCurrent: number;
  avgTemperature: number;
  avgSocPercent: number;
  avgSohPercent: number | null; // null nếu bucket không có reading nào có SOH
}
