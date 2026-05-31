import { jwtDecode } from 'jwt-decode';

export const UserRole = {
  ADMIN:    'ADMIN',
  MANAGER:  'MANAGER',
  STAFF:    'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface SessionUser {
  accountId: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: string[];
}

interface JwtPayload {
  AccountId: string;
  email: string;
  FullName: string;
  role: string;
  perm: string[];
  exp: number;
}

export const decodeToken = (token: string): SessionUser => {
  const p = jwtDecode<JwtPayload>(token);
  return {
    accountId:   p.AccountId,
    email:       p.email,
    fullName:    p.FullName,
    role:        p.role.toUpperCase() as UserRole,
    permissions: p.perm ?? [],
  };
};

export const redirectByRole = (role: UserRole): string | null =>
  ({
    CUSTOMER: '/(customer)/dashboard',
    STAFF:    '/(staff)/',
    ADMIN:    null,
    MANAGER:  null,
  } as Record<UserRole, string | null>)[role] ?? null;
