import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import { RevokeAllPayload, SessionDto } from '../types/account.types';

const { SESSIONS } = ENDPOINTS;

export const sessionService = {
  getSessions: (activeOnly = true) =>
    axiosInstance.get<CommonResponse<SessionDto[]>>(SESSIONS.ME, {
      params: { activeOnly },
    }),

  revokeSession: (sessionId: string) =>
    axiosInstance.delete<CommonResponse<number>>(SESSIONS.REVOKE(sessionId)),

  revokeAll: (data: RevokeAllPayload) =>
    axiosInstance.post<CommonResponse<number>>(SESSIONS.REVOKE_ALL, data),
};
