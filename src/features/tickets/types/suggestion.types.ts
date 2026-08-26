/**
 * AI-ranked KB document suggestions for a ticket.
 *
 * Human-in-the-loop: AI only ranks + states a reason; the technician decides what to
 * read and whether to attach a document to the ticket.
 *
 * Mobile has ONLY the KB portion. Staff suggestions (staff-suggestions) is a Manager
 * task during triage — done on web, not brought to mobile.
 */

export interface KbSuggestionDTO {
  kbArticleId: string;
  code: string;
  title: string;
  /** Relevance score [0..1]. */
  score: number;
  /** Reason text — always shown, this is the basis for the technician to trust the ordering. */
  reason: string;
}

export interface KbSuggestionListDTO {
  items: KbSuggestionDTO[];
  /** Note shown when the list is empty, e.g. "No articles published yet". */
  note: string;
  /**
   * `false` = AI failed to respond (technical error), DIFFERENT from "no matching documents".
   * The UI must distinguish these, otherwise the technician would think the system is
   * saying "there's nothing here".
   */
  aiAvailable: boolean;
}
