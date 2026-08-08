// Notification preferences — field names + format match the BE DTO
// (backend/services/NotificationService/.../Preference/NotificationPreferenceDto.cs).
// GET returns defaults when not yet configured (nothing written to DB); PUT upserts (creates a new record if none exists).

/**
 * ⚠️ GH-83 — MUST declare all 11 fields, do not shorten the list.
 *
 * The BE `UpdateNotificationPreferenceCommand` uses C# property initializers
 * (`NotifyOnChat = true`, `NotifyOnMention = true`, `NotifyOnReaction = false`,
 * `DigestWindowMinutes = null`). This is a **PUT, not a PATCH**: any field missing from the JSON
 * gets its initializer value and is then written to the DB — it does **not** keep the old value.
 *
 * The previous version only declared 7 fields, so every time mobile hit Save, the other 4 fields
 * were reset: a user who turned off chat notifications on web, then opened the app and hit Save,
 * would have it auto-turn back on. Any field without UI yet must still be fetched and sent back
 * unchanged (pass-through).
 */
export interface NotificationPreferenceDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart: string | null; // "HH:mm" | null
  quietHoursEnd: string | null; // "HH:mm" | null
  timeZone: string; // IANA, default "Asia/Ho_Chi_Minh"
  notifyOnChat: boolean;
  notifyOnMention: boolean;
  notifyOnReaction: boolean;
  digestWindowMinutes: number | null; // pass-through — mobile has no Frequency UI yet
}

// PUT body — does NOT send userId (server sets it from the JWT, BE [JsonIgnore]).
// Shape matches the DTO; separate alias for clarity of intent.
export type UpdateNotificationPreferencePayload = NotificationPreferenceDto;
