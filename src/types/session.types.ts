import { jwtDecode } from 'jwt-decode';
import { UserRole } from '@/src/shared/enums/session.enum';

export { UserRole } from '@/src/shared/enums/session.enum';

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
    CUSTOMER: '/(customer)/(tabs)/dashboard',
    STAFF:    '/(staff)/(tabs)/dashboard',
    ADMIN:    null,
    MANAGER:  null,
  } as Record<UserRole, string | null>)[role] ?? null;
