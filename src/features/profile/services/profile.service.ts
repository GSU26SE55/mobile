import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import { AccountDto, UpdateProfilePayload } from '../types/profile.types';

const { PROFILE } = ENDPOINTS;

export const profileService = {
  getMe: () =>
    axiosInstance.get<CommonResponse<AccountDto>>(PROFILE.ME),

  updateProfile: (data: UpdateProfilePayload) =>
    axiosInstance.put<CommonResponse<AccountDto>>(PROFILE.UPDATE, data),

  setAvatar: (avatarFileId: string) =>
    axiosInstance.post<CommonResponse<AccountDto>>(PROFILE.AVATAR, { avatarFileId }),
};
