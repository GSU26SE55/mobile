// GH-68 — permission catalog (BE PermissionDto). GET /api/permissions returns
// CommonResponse<List<PermissionDto>> — every role, admin permission NOT required.
export interface PermissionDto {
  id: string;
  code: string; // format module.action, matches the P.* constant
  module: string;
  description: string | null;
  isSystemPermission: boolean;
  createdAt: string;
}

// Query params for the catalog
export interface PermissionCatalogParams {
  module?: string;
}
