// Enums riêng của ticket chat — pattern `as const` object + type alias
// (KHÔNG dùng TypeScript native enum, theo rules/tech/mobile.md).

/**
 * Trạng thái chuyển giọng nói → văn bản của một chat voice.
 *
 * ⚠️ TicketService có `JsonStringEnumConverter` nên BE trả **CHUỖI** (`"Failed"`), khác
 * NotificationService (trả số). Vì vậy enum này dùng string value, không phải int.
 * Nguồn: `TicketService.Domain/Enums/VoiceTranscriptionStatusEnum.cs` (Pending=1 … Failed=4).
 */
export const VoiceTranscriptionStatusEnum = {
  Pending: 'Pending',
  Processing: 'Processing',
  Completed: 'Completed',
  Failed: 'Failed',
} as const;
export type VoiceTranscriptionStatusEnum =
  (typeof VoiceTranscriptionStatusEnum)[keyof typeof VoiceTranscriptionStatusEnum];

// GH-67 — Phong cách gợi ý AI cho endpoint POST /api/tickets/{id}/chats/suggest.
// BE gửi/nhận string name (TicketService cấu hình JsonStringEnumConverter) — mirror web
// frontend/src/shared/enums/chat.enum.ts. Body gửi STRING, KHÔNG phải int.
export const ChatAiIntentEnum = {
  RequestInfo: 'RequestInfo',       // Yêu cầu thêm thông tin từ Customer
  TechnicalAnswer: 'TechnicalAnswer', // Trả lời kỹ thuật (mặc định)
  Resolution: 'Resolution',         // Đề xuất giải pháp xử lý
  FollowUp: 'FollowUp',             // Theo dõi tiến độ
} as const;
export type ChatAiIntentEnum = (typeof ChatAiIntentEnum)[keyof typeof ChatAiIntentEnum];
