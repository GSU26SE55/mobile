export interface BatteryAssetDto {
  id: string;
  serialNumber: string;
  batteryTypeName: string;
  siteName: string | null;
  status: number;
}
