import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../services/ticket.service';

export interface MentionTarget {
  id: string;
  tag: string;
  name?: string;
}

export function useMentionTargets(ticketId?: string, enabled: boolean = true) {
  const ticketQuery = useQuery({
    queryKey: ['ticketDetail', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const res = await ticketService.getDetail(ticketId);
      return res.data?.data ?? null;
    },
    enabled: !!ticketId && enabled,
    staleTime: 2 * 60 * 1000,
  });

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

  const commentsQuery = useQuery({
    queryKey: ['ticketCommentsList', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const res = await ticketService.getComments(ticketId, { pageSize: 50 });
      return res.data?.data?.items ?? [];
    },
    enabled: !!ticketId && enabled,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = ticketQuery.isLoading || participantsQuery.isLoading || commentsQuery.isLoading;

  const targets = useMemo(() => {
    const ticket = ticketQuery.data;
    const participants = participantsQuery.data ?? [];
    const comments = commentsQuery.data ?? [];

    const list: MentionTarget[] = [];

    // 1. Comment authors
    comments.forEach((c) => {
      if (c.authorDisplayName) {
        const slug = c.authorDisplayName.replace(/\s+/g, '_');
        list.push({
          id: `author-${c.authorUserId ?? c.id}`,
          tag: `@${slug}`,
          name: c.authorDisplayName,
        });
      }
    });

    // 2. Assigned staff
    if (ticket?.assignedStaffName) {
      list.push({
        id: ticket.assignedStaffId ?? 'assigned-staff',
        tag: `@${ticket.assignedStaffName.replace(/\s+/g, '_')}`,
        name: ticket.assignedStaffName,
      });
    }

    // 3. Customer
    if (ticket?.customerName) {
      list.push({
        id: ticket.customerId,
        tag: `@${ticket.customerName.replace(/\s+/g, '_')}`,
        name: ticket.customerName,
      });
    }

    // 4. Ticket participants
    participants.forEach((p) => {
      list.push({
        id: p.id,
        tag: `@${p.userId}`,
        name: String(p.userRole),
      });
    });

    return list;
  }, [ticketQuery.data, participantsQuery.data, commentsQuery.data]);

  return { targets, isLoading };
}
