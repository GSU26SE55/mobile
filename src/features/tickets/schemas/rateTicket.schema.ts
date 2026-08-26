import { z } from 'zod';

export const rateTicketSchema = z.object({
  rating:        z.number().int().min(1, 'Minimum 1 star').max(5, 'Maximum 5 stars'),
  ratingComment: z.string().max(500).optional(),
});

export type RateTicketForm = z.infer<typeof rateTicketSchema>;
