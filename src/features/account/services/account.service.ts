import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  ChangeEmailPayload,
  ChangePasswordPayload,
  ConfirmEmailChangePayload,
  PhoneOtpPayload,
  Init2faResponse,
  Confirm2faPayload,
  Confirm2faResponse,
  Disable2faPayload,
  RegenBackupPayload,
  RegenBackupResponse,
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

  // GH-295: 2FA enroll flow 2 bước
  init2FA: () =>
    axiosInstance.post<CommonResponse<Init2faResponse>>(ACCOUNT.INIT_2FA),

  confirm2FA: (data: Confirm2faPayload) =>
    axiosInstance.post<CommonResponse<Confirm2faResponse>>(ACCOUNT.CONFIRM_2FA, data),

  disable2FA: (data: Disable2faPayload) =>
    axiosInstance.post<CommonResponse<string>>(ACCOUNT.DISABLE_2FA, data),

  regenerateBackupCodes: (data: RegenBackupPayload) =>
    axiosInstance.post<CommonResponse<RegenBackupResponse>>(ACCOUNT.BACKUP_REGEN_2FA, data),

  deactivate: () =>
    axiosInstance.post<CommonResponse<null>>(ACCOUNT.DEACTIVATE),

  deleteAccount: () =>
    axiosInstance.delete<CommonResponse<null>>(ACCOUNT.DELETE),
};
