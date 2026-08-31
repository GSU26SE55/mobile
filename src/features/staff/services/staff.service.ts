import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import { AccountDto } from '@/src/features/profile/types/profile.types';

const { STAFF } = ENDPOINTS;

export const staffService = {
  getProfile: () =>
    axiosInstance.get<CommonResponse<AccountDto>>(STAFF.ME),

  getCustomerById: (id: string) =>
    axiosInstance.get<CommonResponse<AccountDto>>(STAFF.CUSTOMER_DETAIL(id)),
};
