// GH-68 — catalog permission (BE PermissionDto). GET /api/permissions trả
// CommonResponse<List<PermissionDto>> — mọi role, KHÔNG cần quyền admin.
export interface PermissionDto {
  id: string;
  code: string; // dạng module.action, khớp P.* constant
  module: string;
  description: string | null;
  isSystemPermission: boolean;
  createdAt: string;
}

// Query param cho catalog
export interface PermissionCatalogParams {
  module?: string;
}
