// Ngưỡng cảnh báo theo loại pin — BE: BatteryService ThresholdConfigsController
// (GET /api/thresholds/by-type/{batteryTypeId}, role Admin/Manager/Staff đọc được).
// Staff cần xem để biết vì sao 1 reading bị bắn Alert.
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
  // 4 field dưới nullable ở BE (decimal?) — không phải loại pin nào cũng cấu hình.
  currentMaxCharge: number | null;
  currentMaxDischarge: number | null;
  sohWarningThreshold: number | null;
  sohCriticalThreshold: number | null;
  effectiveFromUtc: string;
  isActive: boolean;
}
