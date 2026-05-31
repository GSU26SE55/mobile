export enum RefreshTokenStatus {
  Active = 1,
  Used = 2,
  Revoked = 3,
  Expired = 4,
  Compromised = 5,
}

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

// currentRefreshToken là optional — gửi kèm khi exceptCurrent = true
export interface RevokeAllPayload {
  exceptCurrent: boolean;
  currentRefreshToken?: string;
}
