import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import { MyPermissionsDto } from '../types/permission.types';

const { AUTH } = ENDPOINTS;

export const permissionService = {
  // GH-47 — permission tươi của role user hiện tại (BE resolve qua DB, không đọc perm[] token)
  getMyPermissions: () =>
    axiosInstance.get<CommonResponse<MyPermissionsDto>>(AUTH.ME_PERMISSIONS),
};
