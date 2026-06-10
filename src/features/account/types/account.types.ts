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

export interface TwoFAEnableResponse {
  secret: string;
  otpAuthUri: string;
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
