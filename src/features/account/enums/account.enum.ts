export const RefreshTokenStatus = {
  Active: 1,
  Used: 2,
  Revoked: 3,
  Expired: 4,
  Compromised: 5,
} as const;
export type RefreshTokenStatus = (typeof RefreshTokenStatus)[keyof typeof RefreshTokenStatus];
