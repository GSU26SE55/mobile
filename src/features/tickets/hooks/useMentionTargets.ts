import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../services/ticket.service';
import { useSessionStore } from '@/src/stores/sessionStore';

export interface MentionTarget {
  /** userId — BE receives mentions via { userId, displayName }, does not parse '@' from the body. */
  id: string;
  /** String inserted into the input box: '@Display_Name'. */
  tag: string;
  displayName: string;
  /** Can view internal chat — used to warn when composing an internal chat. */
  canViewInternal: boolean;
}

/**
 * People who can be @-tagged in the chat composer.
 *
 * The correct source is the ticket's active participants (GET .../participants) — NOT
 * authors who have already chatted: someone newly added to the ticket who hasn't sent
 * a message yet must still be taggable.
 *
 * Only filters out the current user. Deliberately does not filter by `canPost`/`canViewInternal` —
 * BE (ChatAddCommandHandler) validates mentions solely by "is an active participant", so a
 * stricter filter here would hide people BE would still allow to be mentioned.
 */
export function useMentionTargets(ticketId?: string, enabled: boolean = true) {
  const currentUserId = useSessionStore((s) => s.user?.accountId);

  const participantsQuery = useQuery({
    queryKey: ['ticketParticipants', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const res = await ticketService.getParticipants(ticketId);
      return res.data?.data ?? [];
    },
    enabled: !!ticketId && enabled,
    staleTime: 2 * 60 * 1000,
  });

  const targets = useMemo<MentionTarget[]>(() => {
    const participants = participantsQuery.data ?? [];
    return participants
      .filter((p) => p.userId !== currentUserId)
      .map((p) => ({
        id: p.userId,
        tag: `@${p.displayName.replace(/\s+/g, '_')}`,
        displayName: p.displayName,
        canViewInternal: p.canViewInternal,
      }));
  }, [participantsQuery.data, currentUserId]);

  return { targets, isLoading: participantsQuery.isLoading };
}
