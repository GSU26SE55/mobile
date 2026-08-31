import type { AnomalyTypeEnum, AlertSeverityEnum } from '@/src/shared/enums/alert.enum';

// Sensor Readings — time-series (TimescaleDB). Does NOT extend AuditableEntity.
// Mirror docs/api-battery.md §Group 4.

export interface SensorReadingDto {
  time: string; // ISO 8601 UTC — TimescaleDB partition key
  batteryAssetId: string;
  voltage: number; // V
  current: number; // A — negative = discharging
  temperature: number; // °C
  socPercent: number; // 0–100
  cycleCount: number | null;
  sourceDeviceId: string | null;
  /**
   * Anomalies BE đã chấm cho chính dòng này (AnomalyRules.Detect + ThresholdConfig của loại pin).
   *
   * Rỗng = trong ngưỡng, HOẶC loại pin chưa cấu hình ngưỡng. Optional để tương thích ngược với
   * BE cũ chưa trả field này.
   */
  anomalies?: SensorReadingAnomalyDto[];
}

/** Một anomaly trên một dòng số đo — đủ để dựng nhãn mà client không cần biết luật. */
export interface SensorReadingAnomalyDto {
  type: AnomalyTypeEnum;
  severity: AlertSeverityEnum;
  thresholdValue: number;
  actualValue: number;
  unit: string; // "V" | "A" | "°C" | "%"
}

export type SensorReadingSortKey = 'time' | 'voltage' | 'current' | 'temperature' | 'socPercent';

export interface SensorReadingHistoryParams {
  from?: string; // UTC
  to?: string; // UTC
  limit?: number; // 1–1000, default 100
  cursor?: string; // timestamp of the last record on the previous page; BE returns records with time < cursor
  // Server-side sort: sortBy='time' (default) → cursor path; any other column requires
  // from+to (the BE sorts the whole [from,to] range), nextCursor=null + hasMore=false.
  sortBy?: SensorReadingSortKey;
  sortDir?: 'asc' | 'desc'; // default desc
}

// Cursor pagination — has NO totalItems (time-series).
export interface SensorReadingHistoryResponseDto {
  items: SensorReadingDto[]; // sorted by time descending
  nextCursor: string | null; // null when data is exhausted
  hasMore: boolean;
}

export type SensorReadingInterval = '1m' | '5m' | '15m' | '1h' | '1d';

export interface SensorReadingAggregateParams {
  from?: string; // UTC
  to?: string; // UTC
  interval?: SensorReadingInterval; // default "1h"
}

// GH-74 — /aggregate/hourly has a fixed 1h bucket → has NO `interval` (docs/api-battery.md §908).
export interface SensorReadingAggregateHourlyParams {
  from?: string; // UTC
  to?: string; // UTC
}

export interface SensorReadingAggregateDto {
  time: string; // bucket start point (UTC) — field "time", not "bucket"
  avgVoltage: number;
  /** ⚠️ Mixes charge/discharge sign (kept for backward-compat). For charts use avgChargeCurrent/avgDischargeCurrent. */
  avgCurrent: number;
  avgTemperature: number;
  avgSocPercent: number;
  avgSohPercent: number | null; // null if no reading in the bucket has SOH

  // --- Sprint Bonus NS-01/NS-02 (#646/#647) — min/max charge-discharge. docs/api-battery.md §SensorReadingAggregateDto.
  // Convention: min/max ALWAYS return a POSITIVE value for both directions (direction is encoded in the field name, FE doesn't handle sign).
  // null = bucket has no sample for that direction. NOT 0 — 0A is a valid measured value, different from "no data".
  minVoltage: number | null;
  maxVoltage: number | null;
  minTemperature: number | null;
  maxTemperature: number | null;
  maxChargeCurrent: number | null; // peak charge current — MAX(current) where current > 0
  minChargeCurrent: number | null;
  avgChargeCurrent: number | null;
  maxDischargeCurrent: number | null; // peak discharge current — MAX(ABS(current)) where current < 0
  minDischargeCurrent: number | null;
  avgDischargeCurrent: number | null;
  chargeSampleCount: number; // 0 if no charge sample (not nullable)
  dischargeSampleCount: number; // 0 if no discharge sample (not nullable)
}

// --- SSE event `stats` — docs/battery-realtime-description.md §5.3bis (NS-01/03/04).
// Rolling min/max charge-discharge current per window. BE fixes EXACTLY 2 windows, not extendable.
export type StatsWindow = '1h' | 'today';

export interface BatteryStatsDto {
  batteryAssetId: string;
  customerId: string;
  // Null fields are OMITTED from the SSE JSON (§5.3) → optional, read via ?? null.
  siteId?: string | null;
  window: StatsWindow;
  windowStart: string; // ISO UTC — window start
  maxChargeCurrent?: number | null; // always positive; absent/null = window has no charge sample yet
  minChargeCurrent?: number | null;
  maxDischargeCurrent?: number | null; // always positive
  minDischargeCurrent?: number | null;
  chargeSampleCount: number;
  dischargeSampleCount: number;
  updatedAt: string; // ISO UTC
}

/**
 * UI shape for min/max charge-discharge of 1 window — the source can be SSE `stats` (push)
 * or a REST `/aggregate` seed (last bucket). Kept separate from `BatteryStatsDto` because the
 * REST seed has NO `customerId`/`batteryAssetId` — forcing it into the wire DTO would mean fabricating data.
 */
export interface BatteryStatsView {
  window: StatsWindow;
  windowStart: string;
  maxChargeCurrent: number | null;
  minChargeCurrent: number | null;
  maxDischargeCurrent: number | null;
  minDischargeCurrent: number | null;
  chargeSampleCount: number;
  dischargeSampleCount: number;
  updatedAt: string;
  /** true = seeded from REST, not yet overwritten by any SSE event. */
  isSeed: boolean;
}

/** Maps the SSE payload → view. Nullable fields may be ABSENT from the JSON (§5.3) → ?? null. */
export function statsDtoToView(dto: BatteryStatsDto): BatteryStatsView {
  return {
    window: dto.window,
    windowStart: dto.windowStart,
    maxChargeCurrent: dto.maxChargeCurrent ?? null,
    minChargeCurrent: dto.minChargeCurrent ?? null,
    maxDischargeCurrent: dto.maxDischargeCurrent ?? null,
    minDischargeCurrent: dto.minDischargeCurrent ?? null,
    chargeSampleCount: dto.chargeSampleCount ?? 0,
    dischargeSampleCount: dto.dischargeSampleCount ?? 0,
    updatedAt: dto.updatedAt,
    isSeed: false,
  };
}
