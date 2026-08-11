import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import type { CommonResponse } from '@/src/types/api.types';
import type {
  BmsSwitchCommandAcceptedDto,
  BmsSwitchStateDto,
  SetBmsSwitchPayload,
} from '../types/bms-switch.types';

export const bmsSwitchService = {
  getState: (assetId: string) =>
    axiosInstance.get<CommonResponse<BmsSwitchStateDto>>(
      ENDPOINTS.BATTERY_ASSETS.BMS_SWITCH(assetId),
    ),
  setSwitch: (assetId: string, payload: SetBmsSwitchPayload) =>
    axiosInstance.post<CommonResponse<BmsSwitchCommandAcceptedDto>>(
      ENDPOINTS.BATTERY_ASSETS.BMS_SWITCH(assetId),
      payload,
    ),
};
