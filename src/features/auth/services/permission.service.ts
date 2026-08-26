import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import { MyPermissionsDto } from '../types/permission.types';

const { AUTH } = ENDPOINTS;

export const permissionService = {
  // GH-47 — fresh permissions for the current user's role (BE resolves via DB, doesn't read token perm[])
  getMyPermissions: () =>
    axiosInstance.get<CommonResponse<MyPermissionsDto>>(AUTH.ME_PERMISSIONS),
};
