// Matches BE AuthService.Domain.Enums.AccountStatusEnum (1-based) — BE serializes as int.
export const AccountStatusEnum = {
  PendingVerification: 1,
  Active: 2,
  Locked: 3,
  Inactive: 4,
  Suspended: 5,
  Banned: 6,
} as const;
export type AccountStatusEnum =
  (typeof AccountStatusEnum)[keyof typeof AccountStatusEnum];

export const AvatarSourceEnum = {
  None: 0,
  Uploaded: 1,
  Google: 2,
} as const;
export type AvatarSourceEnum =
  (typeof AvatarSourceEnum)[keyof typeof AvatarSourceEnum];
