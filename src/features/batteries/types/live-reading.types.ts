// SSE payload event `reading` — mirror docs/battery-realtime-description.md §5.3.
// ⚠️ Null fields are OMITTED from the SSE JSON → every nullable field may be ABSENT.
// Only 8 non-null fields are always present.
export interface LiveReadingDto {
  batteryAssetId: string;
  customerId: string;
  time: string; // ISO 8601 UTC
  voltage: number; // V
  current: number; // A — negative = discharging
  temperature: number; // °C
  socPercent: number; // %
  sourceType: number; // 1=BMS, 2=IoTGateway, 3=External
  // nullable / may be absent:
  siteId?: string | null;
  batteryTypeId?: string | null;
  sohPercent?: number | null;
  cycleCount?: number | null;
  chargingState?: number | null;
  internalResistanceMilliohm?: number | null;
  cellVoltageDeltaMv?: number | null;
  bmsErrorCode?: string | null;
  sourceDeviceId?: string | null;
  sensorSourceCode?: string | null; // 'primary' | 'redundant' | 'external-temp'
}

// GH-58 — SSE payload event `summary` (multi-battery scope) — mirror §5.2.
// Each item is a FULL LiveReadingDto (parity with the `reading` event).
// `scopeType` ('asset'|'customer'|'site'|'type'|'all'|'site:none') → NOT used for routing;
// route by each item's `batteryAssetId`.
export interface BatterySummaryDto {
  scopeType: string;
  items: LiveReadingDto[];
}
