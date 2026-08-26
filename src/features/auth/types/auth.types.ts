export interface LoginPayload {
  email: string;
  password: string;
}

// Google login — mobile sends idToken obtained from native Google Sign-In; BE validates and returns JWT.
export interface GoogleLoginPayload {
  idToken: string;
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
  challengeToken: string; // 32 hex, TTL 5 minutes
  expiresInSeconds: number; // always 300
  methods: string[]; // always ["totp", "backupCode"]
}

// Case A (login complete): tokens set, challenge null.
// Case B (2FA on, login only): tokens null, challenge set.
export interface LoginResultData {
  tokens: TokenDto | null;
  challenge: TwoFactorChallengeDto | null;
  requiresTwoFactor: boolean;
}

// Step 2 of 2FA login (POST /api/auth/login/verify-2fa)
export interface Verify2faLoginPayload {
  challengeToken: string;
  code: string;
  isBackupCode: boolean;
  // #AUTH-58: true ⇒ code is an SMS OTP (mutually exclusive with isBackupCode — never send both as true).
  isSmsCode?: boolean;
  // #AUTH-48: trust device for 30 days — only effective when isBackupCode=false.
  trustDevice?: boolean;
  trustDeviceLabel?: string;
}

// #AUTH-58: send OTP via SMS (POST /api/auth/login/2fa/sms) — X-Challenge-Token header included.
export interface Sms2faPayload {
  challengeToken: string;
}

// #AUTH-50: restore an account soft-deleted within the last 90 days.
export interface ReactivateRequestPayload {
  email: string;
}

export interface ReactivateVerifyPayload {
  email: string;
  otp: string;
}

// SecureStore key holding challengeToken between login → verify-2fa screen (TTL 5 minutes server-side)
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
