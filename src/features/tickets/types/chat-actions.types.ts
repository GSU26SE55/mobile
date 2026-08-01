// Edit/Delete/Dịch/Ghi âm cho ticket chat — nhân bản types từ Web
// (shared/types/chat.types.ts) vì mobile chưa có backend riêng, dùng chung endpoint.
import type { ChatAiIntentEnum } from '../../../shared/enums/chat.enum';

export interface UpdateChatPayload {
  body: string;
  /** Bắt buộc khi sửa tin của người khác qua quyền chat.edit.any (ngoài khung 15 phút của author) */
  editReason?: string;
}

export interface ChatMarkReadPayload {
  chatIds: string[];
}

// POST /api/tickets/{id}/chats/{id}/translate?to={languageCode}
export interface ChatTranslateDTO {
  translatedBody: string;
  targetLanguage: string;
  originalLanguage: string;
  provider: string;
  fromCache: boolean;
}

// POST /api/tickets/{id}/chats/voice (application/json — ChatAttachmentInput của file audio
// đã upload sẵn qua FileStorage). Tạo chat placeholder + transcribe async; response giống
// TicketActionResponse dùng chung cho các action ticket khác.
export interface ChatVoiceActionDTO {
  id: string | null;
  ticketId: string | null;
  code: string | null;
  status: string;
  warnings?: string[] | null;
}

// ── GH-67 — AI chat actions (Staff/Manager/Admin) ─────────────────────────
// Verify từ BE .../DTOs/Response/Chats/*.cs + web frontend/src/shared/types/chat.types.ts.

// POST /api/tickets/{id}/chats/suggest — body. `intent` gửi STRING (JsonStringEnumConverter).
export interface ChatSuggestPayload {
  intent: ChatAiIntentEnum;
}

// POST /api/tickets/{id}/chats/suggest — data
export interface ChatSuggestDTO {
  suggestionId: string;
  suggestions: string[];
}

// POST /api/tickets/{id}/chats/summarize — data
export interface ChatSummarizeDTO {
  summary: string;
}

// POST /api/tickets/{id}/chats/sentiment-check — data
export type ChatSentimentLabel = 'Positive' | 'Neutral' | 'Negative' | 'Critical';
export interface ChatSentimentCheckDTO {
  score: number; // [-1, 1]
  label: ChatSentimentLabel;
  isAlertSent: boolean;
}
