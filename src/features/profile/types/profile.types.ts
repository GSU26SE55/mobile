export enum AccountStatusEnum {
  PendingVerification = 0,
  Active = 1,
  Locked = 2,
  Inactive = 3,
  Suspended = 4,
  Banned = 5,
}

export enum AvatarSourceEnum {
  None = 0,
  Uploaded = 1,
  Google = 2,
}

export interface StaffSkillDto {
  skillCode: string;
  skillLevel: number;
  certifiedUntil: string | null;
}

export interface StaffProfileDto {
  accountId: string;
  employeeCode: string | null;
  department: string | null;
  maxConcurrentTickets: number;
  isAvailable: boolean;
  notes: string | null;
  skills: StaffSkillDto[];
}

export interface AccountProfileDto {
  accountId: string;
  avatarFileId: string | null;
  externalAvatarUrl: string | null;
  avatarSource: AvatarSourceEnum;
  address: string | null;
  birthDate: string | null;
  timeZone: string | null;
}

export interface AccountDto {
  id: string;
  email: string;
  phoneNumber: string | null;
  fullName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  address: string | null;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  twoFactorEnabled: boolean;
  status: AccountStatusEnum;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  roleId: string;
  role: string;
  roleAssignedAt: string | null;
  roleAssignedBy: string | null;
  profile: AccountProfileDto | null;
  staffProfile: StaffProfileDto | null;
  displayAvatarUrl: string | null;
}

export interface UpdateProfilePayload {
  fullName: string;
  phoneNumber?: string;
  address?: string;
  birthDate?: string;
  timeZone?: string;
}
