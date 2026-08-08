import { z } from 'zod';

// Resolve incident — note required, 5–2000 characters (audit trail). Mirror docs/api-battery.md:1724.
export const resolveIncidentSchema = z.object({
  resolutionNote: z
    .string()
    .trim()
    .min(5, 'Minimum 5 characters')
    .max(2000, 'Maximum 2000 characters'),
});

export type ResolveIncidentForm = z.infer<typeof resolveIncidentSchema>;
