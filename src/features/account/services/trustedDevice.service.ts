import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import { TrustedDeviceDto } from '../types/account.types';

const { ACCOUNT } = ENDPOINTS;

// #AUTH-48: quản lý thiết bị tin cậy (self-service).
export const trustedDeviceService = {
  list: () =>
    axiosInstance.get<CommonResponse<TrustedDeviceDto[]>>(ACCOUNT.TRUSTED_DEVICES),

  // revoke 1 device — idempotent (BE trả 200 dù đã revoke trước đó)
  revokeOne: (id: string) =>
    axiosInstance.delete<CommonResponse<string>>(ACCOUNT.TRUSTED_DEVICE(id)),

  // revoke tất cả — count nằm trong message, data = null
  revokeAll: () =>
    axiosInstance.delete<CommonResponse<null>>(ACCOUNT.TRUSTED_DEVICES),
};
