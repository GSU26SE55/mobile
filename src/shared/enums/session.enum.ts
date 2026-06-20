export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
