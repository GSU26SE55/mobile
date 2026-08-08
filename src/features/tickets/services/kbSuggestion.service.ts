import { AI_TIMEOUT, axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import { KbSuggestionListDTO } from '../types/suggestion.types';

export const kbSuggestionService = {
  /**
   * KB documents to reference when handling the ticket.
   *
   * Uses AI_TIMEOUT because the request continues on to the ai-module (gRPC) for
   * scoring — slower than a typical DB query.
   */
  list: (ticketId: string, topN = 5) =>
    axiosInstance.get<CommonResponse<KbSuggestionListDTO>>(
      ENDPOINTS.TICKETS.KB_SUGGESTIONS(ticketId),
      { params: { topN }, timeout: AI_TIMEOUT },
    ),
};
