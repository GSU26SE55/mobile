import { z } from 'zod';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/; // 00:00–23:59

export const notificationPreferenceSchema = z
  .object({
    pushEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    smsEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
    quietHoursStart: z.string().regex(HHMM, 'Format must be HH:mm').nullable(),
    quietHoursEnd: z.string().regex(HHMM, 'Format must be HH:mm').nullable(),
    timeZone: z
      .string()
      .min(1, 'TimeZone cannot be empty')
      .max(100, 'TimeZone must be at most 100 characters'),
    // GH-83 — MUST be declared here, not just in the type. `safeParse` returns an object that strips
    // any key not in the schema, and `parsed.data` is what actually gets sent to BE → missing it from
    // the schema means the field gets dropped and BE overwrites it with the default, the exact same bug as before.
    notifyOnChat: z.boolean(),
    notifyOnMention: z.boolean(),
    notifyOnReaction: z.boolean(),
    // Pass-through: mobile has no Frequency UI yet, so no constraint is invented here.
    digestWindowMinutes: z.number().int().nullable(),
  })
  // BE does NOT enforce the pair (accepts one null and one set) → FE maintains the invariant itself.
  // Does NOT validate start < end — an overnight wrap-around (22:00–07:00) is valid.
  .refine((v) => (v.quietHoursStart == null) === (v.quietHoursEnd == null), {
    message: 'Enter both start and end time, or turn off quiet hours',
    path: ['quietHoursEnd'],
  });

export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
