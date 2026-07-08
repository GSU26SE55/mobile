import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, CursorPaginationResponse } from '../../../types/api.types';
import {
  UpdateChatPayload,
  ChatMarkReadPayload,
  ChatTranslateDTO,
  ChatVoiceActionDTO,
  ChatSuggestDTO,
  ChatSummarizeDTO,
  ChatSentimentCheckDTO,
} from '../types/chat-actions.types';
import { ChatAiIntentEnum } from '../../../shared/enums/chat.enum';
import {
  TicketActionResponse,
  TicketCommentDTO,
  TicketChatReactionsAggregateDTO,
  ReactionTypeEnum,
} from '../types/ticket.types';

export interface ChatCursorParams {
  cursor?: string;
  limit?: number;
}
export interface ChatUnreadCountDTO {
  unreadCount: number;
}

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

  // ── GH-67 — Staff/Manager/Admin ────────────────────────────────────────
  pin: (ticketId: string, chatId: string) =>
    axiosInstance.post<TicketActionResponse>(ENDPOINTS.TICKETS.CHAT_PIN(ticketId, chatId)),

  unpin: (ticketId: string, chatId: string) =>
    axiosInstance.delete<TicketActionResponse>(ENDPOINTS.TICKETS.CHAT_PIN(ticketId, chatId)),

  // AI — intent gửi STRING (BE JsonStringEnumConverter). 200 isSuccess:false (Gemini rate-limit)
  // được interceptor tự reject → xử lý ở onError của hook.
  suggest: (ticketId: string, intent: ChatAiIntentEnum) =>
    axiosInstance.post<CommonResponse<ChatSuggestDTO>>(
      ENDPOINTS.TICKETS.CHAT_SUGGEST(ticketId),
      { intent },
    ),

  summarize: (ticketId: string) =>
    axiosInstance.post<CommonResponse<ChatSummarizeDTO>>(ENDPOINTS.TICKETS.CHAT_SUMMARIZE(ticketId)),

  sentimentCheck: (ticketId: string) =>
    axiosInstance.post<CommonResponse<ChatSentimentCheckDTO>>(ENDPOINTS.TICKETS.CHAT_SENTIMENT(ticketId)),

  // Binary PDF — KHÔNG bọc CommonResponse (giống file-storage.downloadFile). Hook tự guard rỗng.
  exportPdf: (ticketId: string) =>
    axiosInstance.get<ArrayBuffer>(ENDPOINTS.TICKETS.CHAT_EXPORT_PDF(ticketId), {
      responseType: 'arraybuffer',
    }),

  // ── GH-68 — Mọi role ───────────────────────────────────────────────────
  // Cursor pagination — thay page/pageSize. BE trả CursorPaginationResponse (items/nextCursor/hasMore).
  listCursor: (ticketId: string, params?: ChatCursorParams) =>
    axiosInstance.get<CommonResponse<CursorPaginationResponse<TicketCommentDTO>>>(
      ENDPOINTS.TICKETS.CHATS_CURSOR(ticketId),
      { params },
    ),

  getUnreadCount: (ticketId: string) =>
    axiosInstance.get<CommonResponse<ChatUnreadCountDTO>>(
      ENDPOINTS.TICKETS.CHAT_UNREAD_COUNT(ticketId),
    ),

  addReaction: (ticketId: string, chatId: string, reactionType: ReactionTypeEnum) =>
    axiosInstance.post<CommonResponse<TicketChatReactionsAggregateDTO>>(
      ENDPOINTS.TICKETS.CHAT_REACTIONS(ticketId, chatId),
      { reactionType },
    ),

  removeReaction: (ticketId: string, chatId: string, type: ReactionTypeEnum) =>
    axiosInstance.delete<CommonResponse<TicketChatReactionsAggregateDTO>>(
      ENDPOINTS.TICKETS.CHAT_REACTIONS(ticketId, chatId),
      { params: { type } },
    ),

  // {attachmentId} route = FileId. validateStatus:()=>true — 202/451 KHÔNG throw để hook
  // branch theo status thủ công (KHÔNG dùng handleErrorApi vì 2 status này là "success-path").
  downloadAttachment: (ticketId: string, chatId: string, fileId: string) =>
    axiosInstance.get<CommonResponse<string>>(
      ENDPOINTS.TICKETS.CHAT_ATTACHMENT_DOWNLOAD(ticketId, chatId, fileId),
      { validateStatus: () => true },
    ),
};
