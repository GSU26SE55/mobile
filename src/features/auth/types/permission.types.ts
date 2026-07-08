// GH-47 — shape của GET /api/auth/me/permissions
export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  description: string | null;
  isSystemPermission: boolean;
  createdAt: string;
}

export interface MyPermissionsDto {
  roleId: string;
  roleName: string;
  permissions: PermissionDto[];
}
