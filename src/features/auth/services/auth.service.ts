import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResultData,
  Verify2faLoginPayload,
  OtpVerifyPayload,
  ReactivateRequestPayload,
  ReactivateVerifyPayload,
  RegisterPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
  Sms2faPayload,
  VerifyResetOtpData,
  VerifyResetOtpPayload,
  CrossDevice2faRequestPayload,
  CrossDevice2faRequestResponse,
  CrossDevice2faConfirmPayload,
} from '../types/auth.types';

const { AUTH } = ENDPOINTS;

export const authService = {
  login: (data: LoginPayload) =>
    axiosInstance.post<CommonResponse<LoginResultData>>(AUTH.LOGIN, data),

  // GH-295: bước 2 của 2FA login. Header X-Challenge-Token để rate-limit partition đúng (#AUTH-58).
  verify2faLogin: (data: Verify2faLoginPayload) =>
    axiosInstance.post<CommonResponse<LoginResultData>>(AUTH.LOGIN_VERIFY_2FA, data, {
      headers: { 'X-Challenge-Token': data.challengeToken },
    }),

  // #AUTH-58: gửi OTP qua SMS (fallback khi mất Authenticator). data = số điện thoại đã mask.
  send2faSms: (data: Sms2faPayload) =>
    axiosInstance.post<CommonResponse<string>>(AUTH.LOGIN_2FA_SMS, data, {
      headers: { 'X-Challenge-Token': data.challengeToken },
    }),

  // #AUTH-50: khôi phục account đã xóa — bước 1 (gửi OTP), bước 2 (verify, KHÔNG cấp token).
  reactivateRequest: (data: ReactivateRequestPayload) =>
    axiosInstance.post<CommonResponse<string>>(AUTH.REACTIVATE_REQUEST, data),

  reactivateVerify: (data: ReactivateVerifyPayload) =>
    axiosInstance.post<CommonResponse<string>>(AUTH.REACTIVATE_VERIFY, data),

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

  // #AUTH-51: Device A gửi cross-device 2FA request (challengeToken từ login), nhận requestId.
  requestCrossDevice2fa: (data: CrossDevice2faRequestPayload) =>
    axiosInstance.post<CommonResponse<CrossDevice2faRequestResponse>>(
      AUTH.TWO_FA_CROSS_DEVICE_REQUEST,
      data,
    ),

  // #AUTH-51: Device B confirm request bằng TOTP (requestId + totpCode).
  confirmCrossDevice2fa: (data: CrossDevice2faConfirmPayload) =>
    axiosInstance.post<CommonResponse<null>>(AUTH.TWO_FA_CROSS_DEVICE_CONFIRM, data),
};
