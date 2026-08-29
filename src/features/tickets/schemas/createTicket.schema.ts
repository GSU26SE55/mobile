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
  // BE requires EXACTLY one (TicketCreateCommand: `BatteryAssetIds.Count != 1`), not "at
  // least one". The picker is single-select so this cannot happen from the UI today, but
  // the schema is the contract — stating ≥1 here would let a second entry through to a 400.
  batteryAssetIds: z
    .array(z.string().uuid())
    .length(1, 'Select exactly one battery'),
  incidentDetectedAt: z
    .string()
    .datetime()
    .refine((iso) => new Date(iso) <= new Date(), 'Detected time cannot be in the future'),
});

export type CreateTicketForm = z.infer<typeof createTicketSchema>;
