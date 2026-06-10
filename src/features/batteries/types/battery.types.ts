export { BatteryStatusEnum } from '../enums/battery.enum';

import type { BatteryStatusEnum } from '../enums/battery.enum';

export interface BatteryAssetDto {
  id: string;
  serialNumber: string;
  batteryTypeName: string;
  siteName: string | null;
  status: BatteryStatusEnum;
}
