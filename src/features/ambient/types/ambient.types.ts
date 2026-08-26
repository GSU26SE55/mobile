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

// GET /api/ambient/threshold-configs/by-site/{siteId} — the SAME config the backend
// alerts on and the web "Alert threshold" drawer edits. Blank field = not monitored.
export interface AmbientThresholdConfigDto {
  id: string;
  siteId: string;
  highAmbientTempWarning?: number | null;
  highAmbientTempCritical?: number | null;
  highHumidityWarning?: number | null;
  highHumidityCritical?: number | null;
  comboTempThreshold?: number | null;
  comboHumidityThreshold?: number | null;
  enabled: boolean;
  createdAt: string;
}

// GET /api/ambient/readings/history — offset paging (unlike sensor readings, which
// are cursor-paged; ambient volume is far lower).
export interface AmbientHistoryParams {
  siteId: string;
  from?: string; // UTC
  to?: string;   // UTC
  pageNumber?: number;
  pageSize?: number;
}

export interface AmbientHistoryResponse {
  items: AmbientReadingDto[];
  totalItems?: number | null;
}

export type AmbientGranularity = 'day' | 'week' | 'month';

export interface AmbientTrendParams {
  from?: string; // UTC — defaults to the last 30 days
  to?: string;
  granularity?: AmbientGranularity; // default 'day'
}
