// SSE payload event `reading` — mirror docs/battery-realtime-description.md §5.3.
// ⚠️ Field null bị LƯỢC khỏi JSON SSE → mọi field nullable đều có thể VẮNG MẶT.
// Chỉ 8 field non-null luôn có mặt.
export interface LiveReadingDto {
  batteryAssetId: string;
  customerId: string;
  time: string; // ISO 8601 UTC
  voltage: number; // V
  current: number; // A — âm = xả
  temperature: number; // °C
  socPercent: number; // %
  sourceType: number; // 1=BMS, 2=IoTGateway, 3=External
  // nullable / có thể vắng mặt:
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
