import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  ChangeEmailPayload,
  ChangePasswordPayload,
  ConfirmEmailChangePayload,
  PhoneOtpPayload,
  TwoFAEnableResponse,
} from '../types/account.types';

const { ACCOUNT } = ENDPOINTS;

export const accountService = {
  changePassword: (data: ChangePasswordPayload) =>
    axiosInstance.patch<CommonResponse<null>>(ACCOUNT.CHANGE_PASSWORD, data),

  changeEmail: (data: ChangeEmailPayload) =>
    axiosInstance.post<CommonResponse<null>>(ACCOUNT.CHANGE_EMAIL, data),

  confirmEmailChange: (data: ConfirmEmailChangePayload) =>
    axiosInstance.post<CommonResponse<null>>(ACCOUNT.CONFIRM_EMAIL_CHANGE, data),

  sendPhoneOtp: () =>
    axiosInstance.post<CommonResponse<null>>(ACCOUNT.SEND_PHONE_OTP),

  verifyPhoneOtp: (data: PhoneOtpPayload) =>
    axiosInstance.post<CommonResponse<null>>(ACCOUNT.VERIFY_PHONE_OTP, data),

  enable2FA: () =>
    axiosInstance.post<CommonResponse<TwoFAEnableResponse>>(ACCOUNT.ENABLE_2FA),

  disable2FA: () =>
    axiosInstance.post<CommonResponse<null>>(ACCOUNT.DISABLE_2FA),

  deactivate: () =>
    axiosInstance.post<CommonResponse<null>>(ACCOUNT.DEACTIVATE),

  deleteAccount: () =>
    axiosInstance.delete<CommonResponse<null>>(ACCOUNT.DELETE),
};
