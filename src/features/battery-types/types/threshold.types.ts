// Alert threshold per battery type — BE: BatteryService ThresholdConfigsController
// (GET /api/thresholds/by-type/{batteryTypeId}, readable by Admin/Manager/Staff roles).
// Staff need to view this to understand why a reading triggered an Alert.
export interface ThresholdConfigDto {
  id: string;
  batteryTypeId: string;
  batteryTypeName: string;
  voltageMin: number;
  voltageMax: number;
  temperatureMax: number;
  temperatureMin: number;
  socWarningThreshold: number;
  socCriticalThreshold: number;
  // The 4 fields below are nullable at BE (decimal?) — not every battery type has them configured.
  currentMaxCharge: number | null;
  currentMaxDischarge: number | null;
  sohWarningThreshold: number | null;
  sohCriticalThreshold: number | null;
  effectiveFromUtc: string;
  isActive: boolean;
}
