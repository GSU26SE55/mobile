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
