import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import { PermissionDto, PermissionCatalogParams } from '../types/permission.types';

// GH-68 — catalog of all permissions (every role, no admin required). BE returns
// CommonResponse<List<PermissionDto>> — flat list sorted by Module then Code.
export const permissionService = {
  getCatalog: (params?: PermissionCatalogParams) =>
    axiosInstance.get<CommonResponse<PermissionDto[]>>(ENDPOINTS.PERMISSIONS.CATALOG, {
      params,
    }),
};
