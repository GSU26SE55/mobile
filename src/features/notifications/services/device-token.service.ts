import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  RegisterDeviceTokenPayload,
  UnregisterDeviceTokenPayload,
} from '../types/device-token.types';

const { DEVICE_TOKENS } = ENDPOINTS;

/** Legacy device-token API retained for admin compatibility; the mobile runtime does not call it. */
export const deviceTokenService = {
  register: (payload: RegisterDeviceTokenPayload) =>
    axiosInstance.post<CommonResponse<string>>(DEVICE_TOKENS.BASE, payload),

  unregister: (payload: UnregisterDeviceTokenPayload) =>
    axiosInstance.delete<CommonResponse<string>>(DEVICE_TOKENS.BASE, { data: payload }),
};
