import { DevicePlatformEnum } from '../enums/notification.enum';

export { DevicePlatformEnum } from '../enums/notification.enum';

export interface RegisterDeviceTokenPayload {
  token: string;
  platform: DevicePlatformEnum;
  deviceInfo?: string;
}

export interface UnregisterDeviceTokenPayload {
  token: string;
}
