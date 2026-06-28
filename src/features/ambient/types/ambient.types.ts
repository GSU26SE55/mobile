// Ambient DTOs — mirror docs/api-battery.md §Nhóm 8 + §Nhóm 13 (ambient-trend).
import type { AmbientReadingSourceEnum } from '../enums/ambient.enum';

export { AmbientReadingSourceEnum } from '../enums/ambient.enum';

// GET /api/ambient/readings/latest|history
export interface AmbientReadingDto {
  time: string; // ISO 8601 UTC
  siteId: string;
  ambientTemperature: number; // °C
  humidity: number | null; // %
  solarIrradiance: number | null; // W/m²
  source: AmbientReadingSourceEnum;
  sourceDeviceId: string | null;
}

// GET /api/reports/ambient-trend — ⚠️ naming bất đối xứng:
//   temp dùng prefix avg* ; humidity/irradiance dùng suffix *Avg.
export interface AmbientTrendPoint {
  date: string; // mốc bucket UTC
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  humidityAvg: number | null;
  irradianceAvg: number | null;
}

export type AmbientGranularity = 'day' | 'week' | 'month';

export interface AmbientTrendParams {
  from?: string; // UTC — mặc định 30 ngày gần nhất
  to?: string;
  granularity?: AmbientGranularity; // default 'day'
}
