// Ambient DTOs — mirror docs/api-battery.md §Group 8 + §Group 13 (ambient-trend).
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

// GET /api/reports/ambient-trend — ⚠️ asymmetric naming:
//   temp uses prefix avg* ; humidity/irradiance use suffix *Avg.
export interface AmbientTrendPoint {
  date: string; // UTC bucket timestamp
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  humidityAvg: number | null;
  irradianceAvg: number | null;
}

export type AmbientGranularity = 'day' | 'week' | 'month';

export interface AmbientTrendParams {
  from?: string; // UTC — defaults to the last 30 days
  to?: string;
  granularity?: AmbientGranularity; // default 'day'
}
