import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, CursorPaginationResponse } from '@/src/types/api.types';
import {
  UpdateChatPayload,
  ChatMarkReadPayload,
  ChatBulkDeletePayload,
  ChatBulkDeleteResultDTO,
  ChatTranslateDTO,
  ChatVoiceActionDTO,
  ChatSuggestDTO,
  ChatSummarizeDTO,
  ChatReaderDTO,
} from '../types/chat-actions.types';
import { ChatAiIntentEnum } from '@/src/shared/enums/chat.enum';
import {
  TicketActionResponse,
  TicketCommentDTO,
  TicketChatReactionsAggregateDTO,
  ReactionTypeEnum,
} from '../types/ticket.types';
import { fileStorageService } from '@/src/features/file-storage/services/file-storage.service';
import { FilePurposeEnum } from '@/src/features/file-storage/enums/file-storage.enum';

export interface ChatCursorParams {
  cursor?: string;
  limit?: number;
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

  // Xoá nhiều chat trong 1 request (tối đa 50). Partial success — xem
  // ChatBulkDeleteResultDTO. BE trả 400 nếu ticket Closed/ClosedPendingRate.
  bulkRemove: (ticketId: string, payload: ChatBulkDeletePayload) =>
    axiosInstance.delete<CommonResponse<ChatBulkDeleteResultDTO>>(
      ENDPOINTS.TICKETS.CHAT_BULK_DELETE(ticketId),
      { data: payload },
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

  // Voice chat — 2 bước LIÊN TỤC:
  //   1) upload file audio lên FileStorage → lấy metadata (fileId/fileName/contentType/size)
  //   2) POST metadata (ChatAttachmentInput, JSON) xuống /chats/voice → BE tạo chat placeholder
  //      rồi transcribe async. Endpoint KHÔNG còn nhận multipart audio trực tiếp.
  // Nếu bước 1 lỗi → throw NGAY, KHÔNG gọi bước 2 (chưa có file trên server → không có gì để
  // retry; user phải ghi/upload lại). Chỉ khi bước 1 xong (đã có fileId) mới tạo chat, và lúc đó
  // retry transcribe (voice/retry) mới có ý nghĩa vì audio attachment đã tồn tại.
  transcribeVoice: async (
    ticketId: string,
    audioFile: { uri: string; name: string; type: string },
  ) => {
    const upload = await fileStorageService.uploadFile({
      uri: audioFile.uri,
      name: audioFile.name,
      type: audioFile.type,
      purpose: FilePurposeEnum.TicketAttachment,
    });
    const meta = upload.data.data;
    // BE ChatVoiceTranscribeCommand validate `Url` bắt buộc → thiếu publicUrl thì bước 2 chắc
    // chắn 400. Chặn sớm với thông báo rõ thay vì để lỗi mơ hồ từ /chats/voice.
    if (!meta?.fileId || !meta.publicUrl) {
      throw new Error('Tải lên âm thanh thất bại — vui lòng ghi âm và gửi lại.');
    }
    return axiosInstance.post<CommonResponse<ChatVoiceActionDTO>>(
      ENDPOINTS.TICKETS.CHAT_VOICE(ticketId),
      {
        fileId: meta.fileId,
        fileName: meta.fileName,
        contentType: meta.contentType,
        sizeBytes: meta.size,
        url: meta.publicUrl,
      },
    );
  },

  // GH-83 — retry chuyển giọng nói → văn bản cho chat đang ở trạng thái Failed.
  // Không body. BE trả **202 Accepted** (xử lý bất đồng bộ) nên response CHƯA có kết quả —
  // phải refetch danh sách chat mới thấy trạng thái đổi.
  // 409 = chat chưa Failed (hoặc không có audio attachment); 404 = chat không thuộc ticket.
  retryVoice: (ticketId: string, chatId: string) =>
    axiosInstance.post<CommonResponse<ChatVoiceActionDTO>>(
      ENDPOINTS.TICKETS.CHAT_VOICE_RETRY(ticketId, chatId),
    ),

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

  // ── GH-68 — Mọi role ───────────────────────────────────────────────────
  // Cursor pagination — thay page/pageSize. BE trả CursorPaginationResponse (items/nextCursor/hasMore).
  listCursor: (ticketId: string, params?: ChatCursorParams) =>
    axiosInstance.get<CommonResponse<CursorPaginationResponse<TicketCommentDTO>>>(
      ENDPOINTS.TICKETS.CHATS_CURSOR(ticketId),
      { params },
    ),

  // BE trả CommonResponse<int> — data là SỐ THUẦN, không phải object.
  // (TicketUnreadCountResponse : CommonResponse<int>). Đừng bọc lại thành DTO.
  getUnreadCount: (ticketId: string) =>
    axiosInstance.get<CommonResponse<number>>(
      ENDPOINTS.TICKETS.CHAT_UNREAD_COUNT(ticketId),
    ),

  // Ai đã đọc 1 chat — Staff/Manager/Admin ONLY. KHÔNG gọi từ màn Customer (403).
  getReaders: (ticketId: string, chatId: string) =>
    axiosInstance.get<CommonResponse<ChatReaderDTO[]>>(
      ENDPOINTS.TICKETS.CHAT_READERS(ticketId, chatId),
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
