import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  UpdateChatPayload,
  ChatMarkReadPayload,
  ChatTranslateDTO,
  ChatVoiceActionDTO,
} from '../types/chat-actions.types';

// Edit/Delete/Mark-read/Translate/Voice cho ticket chat — cùng endpoint
// /api/tickets/{id}/chats mà staff đã gọi để list/add comment.
export const ticketChatActionsService = {
  update: (ticketId: string, chatId: string, payload: UpdateChatPayload) =>
    axiosInstance.put<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_DETAIL(ticketId, chatId),
      payload,
    ),

  remove: (ticketId: string, chatId: string, reason?: string) =>
    axiosInstance.delete<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_DETAIL(ticketId, chatId),
      { data: reason ? { reason } : undefined },
    ),

  markRead: (ticketId: string, payload: ChatMarkReadPayload) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_MARK_READ(ticketId),
      payload,
    ),

  translate: (ticketId: string, chatId: string, targetLanguage: string) =>
    axiosInstance.post<CommonResponse<ChatTranslateDTO>>(
      ENDPOINTS.TICKETS.CHAT_TRANSLATE(ticketId, chatId),
      null,
      { params: { to: targetLanguage } },
    ),

  // RN: content-type PHẢI set cứng 'multipart/form-data' (không boundary) — xem
  // ghi chú trong file-storage.service.ts (bug Android nếu để axios tự suy ra).
  transcribeVoice: (ticketId: string, audioFile: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('AudioFile', {
      uri: audioFile.uri,
      name: audioFile.name,
      type: audioFile.type,
    } as unknown as Blob);
    return axiosInstance.post<CommonResponse<ChatVoiceActionDTO>>(
      ENDPOINTS.TICKETS.CHAT_VOICE(ticketId),
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};
