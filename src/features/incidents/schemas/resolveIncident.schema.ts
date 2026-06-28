import { z } from 'zod';

// Resolve incident — note bắt buộc 5–2000 ký tự (audit trail). Mirror docs/api-battery.md:1724.
export const resolveIncidentSchema = z.object({
  resolutionNote: z
    .string()
    .trim()
    .min(5, 'Tối thiểu 5 ký tự')
    .max(2000, 'Tối đa 2000 ký tự'),
});

export type ResolveIncidentForm = z.infer<typeof resolveIncidentSchema>;
