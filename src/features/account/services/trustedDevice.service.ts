import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import { TrustedDeviceDto } from '../types/account.types';

const { ACCOUNT } = ENDPOINTS;

// #AUTH-48: manage trusted devices (self-service).
export const trustedDeviceService = {
  list: () =>
    axiosInstance.get<CommonResponse<TrustedDeviceDto[]>>(ACCOUNT.TRUSTED_DEVICES),

  // revoke 1 device — idempotent (BE returns 200 even if already revoked)
  revokeOne: (id: string) =>
    axiosInstance.delete<CommonResponse<string>>(ACCOUNT.TRUSTED_DEVICE(id)),

  // revoke all — count is included in the message, data = null
  revokeAll: () =>
    axiosInstance.delete<CommonResponse<null>>(ACCOUNT.TRUSTED_DEVICES),
};
