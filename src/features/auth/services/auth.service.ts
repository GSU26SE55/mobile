import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResultData,
  Verify2faLoginPayload,
  OtpVerifyPayload,
  RegisterPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
  VerifyResetOtpData,
  VerifyResetOtpPayload,
} from '../types/auth.types';

const { AUTH } = ENDPOINTS;

export const authService = {
  login: (data: LoginPayload) =>
    axiosInstance.post<CommonResponse<LoginResultData>>(AUTH.LOGIN, data),

  // GH-295: bước 2 của 2FA login
  verify2faLogin: (data: Verify2faLoginPayload) =>
    axiosInstance.post<CommonResponse<LoginResultData>>(AUTH.LOGIN_VERIFY_2FA, data),

  register: (data: RegisterPayload) =>
    axiosInstance.post<CommonResponse<null>>(AUTH.REGISTER, data),

  verifyOtp: (data: OtpVerifyPayload) =>
    axiosInstance.post<CommonResponse<null>>(AUTH.VERIFY_OTP, data),

  resendOtp: (data: ResendOtpPayload) =>
    axiosInstance.post<CommonResponse<null>>(AUTH.RESEND_OTP, data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    axiosInstance.post<CommonResponse<null>>(AUTH.FORGOT_PASSWORD, data),

  verifyResetOtp: (data: VerifyResetOtpPayload) =>
    axiosInstance.post<CommonResponse<VerifyResetOtpData>>(AUTH.VERIFY_RESET_OTP, data),

  resendResetOtp: (data: ResendOtpPayload) =>
    axiosInstance.post<CommonResponse<null>>(AUTH.RESEND_RESET_OTP, data),

  resetPassword: (data: ResetPasswordPayload) =>
    axiosInstance.post<CommonResponse<null>>(AUTH.RESET_PASSWORD, data),

  logout: (refreshToken: string) =>
    axiosInstance.post<CommonResponse<null>>(AUTH.LOGOUT, { refreshToken }),
};
