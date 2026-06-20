export { RefreshTokenStatus } from '../enums/account.enum';

import type { RefreshTokenStatus } from '../enums/account.enum';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeEmailPayload {
  newEmail: string;
  currentPassword: string;
}

export interface ConfirmEmailChangePayload {
  otp: string;
}

export interface PhoneOtpPayload {
  otp: string;
}

// ── GH-295: 2FA enroll flow 2 bước ──
// Bước 1 — POST /api/accounts/me/2fa/init (CHƯA activate)
export interface Init2faResponse {
  secret: string; // base32 — nhập tay nếu không quét QR
  otpAuthUri: string; // otpauth://... — render QR
  pendingToken: string; // gửi kèm bước confirm
}

// Bước 2 — POST /api/accounts/me/2fa/confirm
export interface Confirm2faPayload {
  pendingToken: string;
  code: string; // TOTP 6 số
}
export interface Confirm2faResponse {
  enabled: boolean;
  backupCodes: string[]; // 8 codes — hiển thị 1 lần
}

// POST /api/accounts/me/2fa/disable — re-auth bằng password + TOTP
export interface Disable2faPayload {
  password: string;
  totpCode: string;
}

// POST /api/accounts/me/2fa/backup-codes/regenerate
export interface RegenBackupPayload {
  totpCode: string;
}
export interface RegenBackupResponse {
  backupCodes: string[];
}

export interface SessionDto {
  id: string;
  issuedAt: string;
  expiredAt: string;
  status: RefreshTokenStatus;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  isCurrent: boolean;
}

export interface RevokeAllPayload {
  exceptCurrent: boolean;
  currentRefreshToken?: string;
}

// ── #AUTH-48: Trusted Devices ──
// GET /api/accounts/me/trusted-devices
export interface TrustedDeviceDto {
  id: string;
  label: string;
  ipPrefix: string;
  userAgentSnapshot: string | null;
  trustedAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  usageCount: number;
  isCurrentDevice: boolean;
}

// ── #AUTH-62: GDPR data export (GET /api/accounts/me/export) ──
// Lưu ý: mọi field enum BE serialize thành STRING ("Active", "LoginSuccess", "Tier2") — type là string.
export interface AccountExportSnapshot {
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
  status: string;
  googleId: string | null;
  provider: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  role: string;
  createdAt: string;
}

export interface AccountProfileExportSnapshot {
  externalAvatarUrl: string | null;
  avatarSource: string | null;
  address: string | null;
  birthDate: string | null;
  timeZone: string | null;
}

export interface StaffProfileExportSnapshot {
  employeeCode: string | null;
  department: string | null;
  skillTier: string | null;
  notes: string | null;
}

export interface SessionExportSnapshot {
  id: string;
  issuedAt: string;
  expiredAt: string;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
}

export interface AuditLogExportSnapshot {
  id: string;
  action: string;
  occurredAt: string;
  isSuccess: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
}

export interface BackupCodeExportSnapshot {
  id: string;
  createdAt: string;
  redeemedAt: string | null;
}

export interface AccountDataExportDto {
  account: AccountExportSnapshot;
  profile: AccountProfileExportSnapshot | null;
  staffProfile: StaffProfileExportSnapshot | null;
  sessions: SessionExportSnapshot[];
  auditLogs: AuditLogExportSnapshot[];
  backupCodes: BackupCodeExportSnapshot[];
  exportedAt: string;
  format: string;
  version: string;
}
