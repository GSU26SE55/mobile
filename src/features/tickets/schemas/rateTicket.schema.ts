import { z } from 'zod';

export const rateTicketSchema = z.object({
  rating:        z.number().int().min(1, 'Tối thiểu 1 sao').max(5, 'Tối đa 5 sao'),
  ratingComment: z.string().max(500).optional(),
});

export type RateTicketForm = z.infer<typeof rateTicketSchema>;
