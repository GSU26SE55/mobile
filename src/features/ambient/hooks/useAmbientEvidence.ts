import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { EVIDENCE_WINDOW_MS } from '@/src/features/batteries/hooks/useReadingEvidence';
import { ambientService } from '../services/ambient.service';

/**
 * Ambient readings around an environmental incident's detection time — EVIDENCE for a
 * site-level ticket, not the live feed.
 *
 * The window is imported from the battery evidence hook rather than redeclared: a Staff
 * member reads a site ticket and a battery ticket in the same session, and if the two
 * panels used different spans then "the readings around detection" would silently mean
 * two different things depending on which kind of ticket happened to be open. Web keeps
 * these in sync by comment; here the compiler does it.
 *
 * `pageSize: 200` mirrors the battery evidence limit — a ±2' window can never hold that
 * many rows, so one page always covers the whole window and the panel never paginates.
 * Filtering is server-side (`GetAmbientReadingHistoryQuery` applies Time >= From / <= To).
 */
export function useAmbientEvidence(
  siteId: string | null | undefined,
  anchorAt: string | null | undefined,
) {
  // Both sides of the anchor: the build-up sits before the stamp, the aftermath after it.
  const anchor = anchorAt ? new Date(anchorAt).getTime() : null;
  const from = anchor ? new Date(anchor - EVIDENCE_WINDOW_MS).toISOString() : undefined;
  const to = anchor ? new Date(anchor + EVIDENCE_WINDOW_MS).toISOString() : undefined;

  const params = { siteId: siteId ?? '', from, to, pageNumber: 1, pageSize: 200 };

  return useQuery({
    queryKey: QUERY_KEY.ambient.history(siteId ?? '', { from, to }),
    queryFn: async () => {
      const res = await ambientService.getHistory(params);
      return res.data.data;
    },
    enabled: !!siteId && !!anchor,
  });
}
