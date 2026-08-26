import { z } from 'zod';
import { TicketCategoryEnum } from '@/src/shared/enums/ticket.enum';

// Matches BE TicketCreateCommand.ValidateAsync (POST /api/customer/tickets).
// GH-866: batteryAssetIds is a REQUIRED array (≥1, distinct); incidentDetectedAt is
// a SINGLE required timestamp, cannot be in the future.
//
// Length limits come from the DB (TicketConfiguration.cs), NOT from ValidateAsync —
// BE only checks for empty, so exceeding the column limit blows up at the DB layer
// instead of returning a clean 400:
//   Title       → HasMaxLength(256)
//   Description → IsRequired(), NO limit (text) — 500 is a UI-imposed limit.
export const createTicketSchema = z.object({
  title:       z.string().trim().min(1, 'Cannot be empty').max(256, 'Maximum 256 characters'),
  description: z
    .string()
    .trim()
    .min(5, 'Minimum 5 characters')
    .max(500, 'Maximum 500 characters'),
  category:    z.nativeEnum(TicketCategoryEnum),
  batteryAssetIds: z
    .array(z.string().uuid())
    .min(1, 'Must select at least one battery')
    .refine((ids) => new Set(ids).size === ids.length, 'Battery list must not contain duplicates'),
  incidentDetectedAt: z
    .string()
    .datetime()
    .refine((iso) => new Date(iso) <= new Date(), 'Detected time cannot be in the future'),
});

export type CreateTicketForm = z.infer<typeof createTicketSchema>;
