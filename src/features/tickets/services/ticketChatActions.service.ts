import { AI_TIMEOUT, axiosInstance } from '@/src/lib/axios';
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
import { ChatAiIntentEnum } from '@/src/features/tickets/enums/chat.enum';
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

// Edit/Delete/Mark-read/Translate/Voice for ticket chat — same endpoint
// /api/tickets/{id}/chats that staff already call to list/add comments.
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

  // Delete multiple chats in 1 request (max 50). Partial success — see
  // ChatBulkDeleteResultDTO. BE returns 400 if the ticket is terminal.
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
      { params: { to: targetLanguage }, timeout: AI_TIMEOUT },
    ),

  // Voice chat — 2 SEQUENTIAL steps:
  //   1) upload the audio file to FileStorage → get metadata (fileId/fileName/contentType/size)
  //   2) POST that metadata (ChatAttachmentInput, JSON) to /chats/voice → BE creates a chat
  //      placeholder then transcribes asynchronously. The endpoint no longer accepts
  //      multipart audio directly.
  // If step 1 fails → throw IMMEDIATELY, do NOT call step 2 (no file exists on the server yet →
  // nothing to retry; the user must record/upload again). Only once step 1 succeeds (fileId
  // exists) is the chat created, and only then does retry-transcribe (voice/retry) make sense,
  // since the audio attachment already exists.
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
    if (!meta?.fileId) {
      throw new Error('Audio upload failed — please record and send again.');
    }
    // BE requires `Url` to be present, but only stores it as metadata on TicketAttachment.Url —
    // VoiceTranscriptionRequestedConsumer downloads the audio via internal gRPC using `fileId`,
    // it does not touch this string.
    //
    // GH-788 — so this must NOT block when publicUrl is null. The object bucket is private, so
    // PublicBaseUrl is empty in every environment ⇒ publicUrl is always null ⇒ the old code threw
    // right here, and the recording feature could never run. Fall back to the auth-checked
    // download route — same convention as useUploadTicketAttachment.
    return axiosInstance.post<CommonResponse<ChatVoiceActionDTO>>(
      ENDPOINTS.TICKETS.CHAT_VOICE(ticketId),
      {
        fileId: meta.fileId,
        fileName: meta.fileName,
        contentType: meta.contentType,
        sizeBytes: meta.size,
        url: meta.publicUrl ?? ENDPOINTS.FILES.DOWNLOAD(meta.fileId),
      },
    );
  },

  // GH-83 — retry voice-to-text conversion for a chat currently in Failed status.
  // No body. BE returns **202 Accepted** (async processing) so the response has NO result yet —
  // must refetch the chat list to see the status change.
  // 409 = chat isn't Failed (or has no audio attachment); 404 = chat doesn't belong to the ticket.
  retryVoice: (ticketId: string, chatId: string) =>
    axiosInstance.post<CommonResponse<ChatVoiceActionDTO>>(
      ENDPOINTS.TICKETS.CHAT_VOICE_RETRY(ticketId, chatId),
    ),

  // ── GH-67 — Staff/Manager/Admin ────────────────────────────────────────
  pin: (ticketId: string, chatId: string) =>
    axiosInstance.post<TicketActionResponse>(ENDPOINTS.TICKETS.CHAT_PIN(ticketId, chatId)),

  unpin: (ticketId: string, chatId: string) =>
    axiosInstance.delete<TicketActionResponse>(ENDPOINTS.TICKETS.CHAT_PIN(ticketId, chatId)),

  // AI — intent is sent as a STRING (BE JsonStringEnumConverter). 200 isSuccess:false (Gemini
  // rate-limit) is auto-rejected by the interceptor → handled in the hook's onError.
  suggest: (ticketId: string, intent: ChatAiIntentEnum) =>
    axiosInstance.post<CommonResponse<ChatSuggestDTO>>(
      ENDPOINTS.TICKETS.CHAT_SUGGEST(ticketId),
      { intent },
      { timeout: AI_TIMEOUT },
    ),

  summarize: (ticketId: string) =>
    axiosInstance.post<CommonResponse<ChatSummarizeDTO>>(
      ENDPOINTS.TICKETS.CHAT_SUMMARIZE(ticketId),
      null,
      { timeout: AI_TIMEOUT },
    ),

  // ── GH-68 — All roles ───────────────────────────────────────────────────
  // Cursor pagination — replaces page/pageSize. BE returns CursorPaginationResponse (items/nextCursor/hasMore).
  listCursor: (ticketId: string, params?: ChatCursorParams) =>
    axiosInstance.get<CommonResponse<CursorPaginationResponse<TicketCommentDTO>>>(
      ENDPOINTS.TICKETS.CHATS_CURSOR(ticketId),
      { params },
    ),

  // BE returns CommonResponse<int> — data is a PLAIN NUMBER, not an object.
  // (TicketUnreadCountResponse : CommonResponse<int>). Don't wrap it back into a DTO.
  getUnreadCount: (ticketId: string) =>
    axiosInstance.get<CommonResponse<number>>(
      ENDPOINTS.TICKETS.CHAT_UNREAD_COUNT(ticketId),
    ),

  // Who has read a chat — Staff/Manager/Admin ONLY. Do NOT call from Customer screens (403).
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

  // {attachmentId} route = FileId. validateStatus:()=>true — 202/451 do NOT throw, so the hook
  // can branch on status manually (NOT using handleErrorApi since these 2 statuses are "success-path").
  downloadAttachment: (ticketId: string, chatId: string, fileId: string) =>
    axiosInstance.get<CommonResponse<string>>(
      ENDPOINTS.TICKETS.CHAT_ATTACHMENT_DOWNLOAD(ticketId, chatId, fileId),
      { validateStatus: () => true },
    ),
};
