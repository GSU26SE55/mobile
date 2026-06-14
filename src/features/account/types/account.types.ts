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
