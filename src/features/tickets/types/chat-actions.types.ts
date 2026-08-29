// Edit/Delete/Translate/Voice for ticket chat — types duplicated from Web
// (shared/types/chat.types.ts) since mobile has no dedicated backend, uses the shared endpoint.
import type { ChatAiIntentEnum } from '@/src/features/tickets/enums/chat.enum';
import type { ActorRoleEnum } from '@/src/shared/enums/ticket.enum';

export interface UpdateChatPayload {
  body: string;
  /** Required when editing another person's message via the chat.edit.any permission (outside the author's 15-minute window) */
  editReason?: string;
}

export interface ChatMarkReadPayload {
  chatIds: string[];
}

/** DELETE /chats/bulk — max 50 ids/request (BE ChatBulkDeleteCommand.MaxBatchSize). */
export const CHAT_BULK_DELETE_MAX = 50;

export interface ChatBulkDeletePayload {
  chatIds: string[];
}

/**
 * Bulk delete result. NOTE: `deleted + skipped` does NOT equal the number of ids sent —
 * other people's chats are hidden separately (TicketChatHide) and counted in neither.
 * Mobile only allows selecting the current user's own messages, so this branch is not
 * actually hit in practice.
 */
export interface ChatBulkDeleteResultDTO {
  deleted: number;
  skipped: number;
  /** Ids not found / already deleted previously. */
  skippedIds: string[];
}

// GET /api/tickets/{tid}/chats/{cid}/readers — who has read a chat.
// Auth: Staff/Manager/Admin ONLY — Customer calls get a 403.
export interface ChatReaderDTO {
  chatId: string;
  userId: string;
  /** BE resolves from CustomerAccounts/StaffAccounts; falls back to userId if not found. */
  displayName: string;
  /** Null → render the initial of displayName instead. */
  avatarUrl?: string | null;
  role: ActorRoleEnum;
  readAt: string;
}

// POST /api/tickets/{id}/chats/{id}/translate?to={languageCode}
export interface ChatTranslateDTO {
  translatedBody: string;
  targetLanguage: string;
  originalLanguage: string;
  provider: string;
  fromCache: boolean;
}

// POST /api/tickets/{id}/chats/voice (application/json — ChatAttachmentInput of an audio file
// already uploaded via FileStorage). Creates a chat placeholder + transcribes asynchronously;
// response shape matches TicketActionResponse shared with other ticket actions.
export interface ChatVoiceActionDTO {
  id: string | null;
  ticketId: string | null;
  code: string | null;
  status: string;
  warnings?: string[] | null;
}

// ── GH-67 — AI chat actions (Staff/Manager/Admin) ─────────────────────────
// Verified against BE .../DTOs/Response/Chats/*.cs + web frontend/src/shared/types/chat.types.ts.

// POST /api/tickets/{id}/chats/suggest — body. `intent` is sent as a STRING (JsonStringEnumConverter).
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
