export const AccountStatusEnum = {
  PendingVerification: 0,
  Active: 1,
  Locked: 2,
  Inactive: 3,
  Suspended: 4,
  Banned: 5,
} as const;
export type AccountStatusEnum = (typeof AccountStatusEnum)[keyof typeof AccountStatusEnum];

export const AvatarSourceEnum = {
  None: 0,
  Uploaded: 1,
  Google: 2,
} as const;
export type AvatarSourceEnum = (typeof AvatarSourceEnum)[keyof typeof AvatarSourceEnum];
