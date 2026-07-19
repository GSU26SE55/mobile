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

// GH-74 — /aggregate/hourly cố định bucket 1h → KHÔNG có `interval` (docs/api-battery.md §908).
export interface SensorReadingAggregateHourlyParams {
  from?: string; // UTC
  to?: string; // UTC
}

export interface SensorReadingAggregateDto {
  time: string; // điểm bắt đầu bucket (UTC) — field "time", không phải "bucket"
  avgVoltage: number;
  /** ⚠️ Trộn dấu nạp/xả (giữ backward-compat). Vẽ chart dùng avgChargeCurrent/avgDischargeCurrent. */
  avgCurrent: number;
  avgTemperature: number;
  avgSocPercent: number;
  avgSohPercent: number | null; // null nếu bucket không có reading nào có SOH

  // --- Sprint Bonus NS-01/NS-02 (#646/#647) — min/max nạp-xả. docs/api-battery.md §SensorReadingAggregateDto.
  // Quy ước: min/max LUÔN trả giá trị DƯƠNG cho cả 2 chiều (chiều nằm trong tên field, FE không xử lý dấu).
  // null = bucket không có mẫu chiều đó. KHÔNG phải 0 — 0A là giá trị đo hợp lệ, khác "không có dữ liệu".
  minVoltage: number | null;
  maxVoltage: number | null;
  minTemperature: number | null;
  maxTemperature: number | null;
  maxChargeCurrent: number | null; // dòng nạp đỉnh — MAX(current) với current > 0
  minChargeCurrent: number | null;
  avgChargeCurrent: number | null;
  maxDischargeCurrent: number | null; // dòng xả đỉnh — MAX(ABS(current)) với current < 0
  minDischargeCurrent: number | null;
  avgDischargeCurrent: number | null;
  chargeSampleCount: number; // 0 nếu không có mẫu nạp (không nullable)
  dischargeSampleCount: number; // 0 nếu không có mẫu xả (không nullable)
}

// --- SSE event `stats` — docs/battery-realtime-description.md §5.3bis (NS-01/03/04).
// Rolling min/max dòng nạp/xả theo window. BE chốt ĐÚNG 2 window, không mở rộng.
export type StatsWindow = '1h' | 'today';

export interface BatteryStatsDto {
  batteryAssetId: string;
  customerId: string;
  // Field null bị LƯỢC khỏi JSON SSE (§5.3) → optional, đọc bằng ?? null.
  siteId?: string | null;
  window: StatsWindow;
  windowStart: string; // ISO UTC — đầu window
  maxChargeCurrent?: number | null; // luôn dương; vắng/null = window chưa có mẫu nạp
  minChargeCurrent?: number | null;
  maxDischargeCurrent?: number | null; // luôn dương
  minDischargeCurrent?: number | null;
  chargeSampleCount: number;
  dischargeSampleCount: number;
  updatedAt: string; // ISO UTC
}

/**
 * Shape UI dùng cho min/max nạp-xả của 1 window — nguồn có thể là SSE `stats` (push)
 * hoặc seed REST `/aggregate` (bucket cuối). Tách khỏi `BatteryStatsDto` vì seed REST
 * KHÔNG có `customerId`/`batteryAssetId` — ép vào DTO wire sẽ phải bịa dữ liệu.
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
  /** true = seed từ REST, chưa có event SSE nào đè lên. */
  isSeed: boolean;
}

/** Map payload SSE → view. Field nullable có thể VẮNG khỏi JSON (§5.3) → ?? null. */
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
