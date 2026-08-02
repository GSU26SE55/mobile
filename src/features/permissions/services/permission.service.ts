import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import { PermissionDto, PermissionCatalogParams } from '../types/permission.types';

// GH-68 — catalog toàn bộ permission (mọi role, không cần admin). BE trả
// CommonResponse<List<PermissionDto>> — flat list sort theo Module rồi Code.
export const permissionService = {
  getCatalog: (params?: PermissionCatalogParams) =>
    axiosInstance.get<CommonResponse<PermissionDto[]>>(ENDPOINTS.PERMISSIONS.CATALOG, {
      params,
    }),
};
