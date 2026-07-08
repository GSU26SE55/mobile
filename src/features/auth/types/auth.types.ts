export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface OtpVerifyPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

// ── GH-295: LoginResultDto — discriminated union (login + refresh) ──
export interface TokenDto {
  accessToken: string;
  refreshToken: string;
}

export interface TwoFactorChallengeDto {
  challengeToken: string; // 32 hex, TTL 5 phút
  expiresInSeconds: number; // luôn 300
  methods: string[]; // luôn ["totp", "backupCode"]
}

// Case A (login complete): tokens set, challenge null.
// Case B (2FA on, chỉ login): tokens null, challenge set.
export interface LoginResultData {
  tokens: TokenDto | null;
  challenge: TwoFactorChallengeDto | null;
  requiresTwoFactor: boolean;
}

// Bước 2 của 2FA login (POST /api/auth/login/verify-2fa)
export interface Verify2faLoginPayload {
  challengeToken: string;
  code: string;
  isBackupCode: boolean;
  // #AUTH-58: true ⇒ code là SMS OTP (mutex với isBackupCode — không gửi cả 2 = true).
  isSmsCode?: boolean;
  // #AUTH-48: trust device 30 ngày — chỉ hiệu lực khi isBackupCode=false.
  trustDevice?: boolean;
  trustDeviceLabel?: string;
}

// #AUTH-58: gửi OTP qua SMS (POST /api/auth/login/2fa/sms) — header X-Challenge-Token kèm theo.
export interface Sms2faPayload {
  challengeToken: string;
}

// #AUTH-50: khôi phục account đã soft-delete trong 90 ngày.
export interface ReactivateRequestPayload {
  email: string;
}

export interface ReactivateVerifyPayload {
  email: string;
  otp: string;
}

// Key SecureStore giữ challengeToken giữa login → màn hình verify-2fa (TTL 5 phút server-side)
export const CHALLENGE_TOKEN_KEY = 'login_2fa_challenge';

export interface VerifyResetOtpData {
  resetToken: string;
  expiresInSeconds: number;
}

// #AUTH-51: cross-device 2FA confirm — Device A requests, Device B confirms.
export interface CrossDevice2faRequestPayload {
  challengeToken: string;
}

export interface CrossDevice2faRequestResponse {
  requestId: string;
  expiresInSeconds: number;
}

export interface CrossDevice2faConfirmPayload {
  requestId: string;
  totpCode: string;
}
