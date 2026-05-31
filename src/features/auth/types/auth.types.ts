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

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyResetOtpData {
  resetToken: string;
  expiresInSeconds: number;
}
