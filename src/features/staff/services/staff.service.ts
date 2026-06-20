import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import { AccountDto } from '../../profile/types/profile.types';

const { STAFF } = ENDPOINTS;

export const staffService = {
  getProfile: () =>
    axiosInstance.get<CommonResponse<AccountDto>>(STAFF.ME),
};
