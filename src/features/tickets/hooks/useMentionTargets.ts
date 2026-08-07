import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../services/ticket.service';
import { useSessionStore } from '@/src/stores/sessionStore';

export interface MentionTarget {
  /** userId — BE nhận mention qua { userId, displayName }, không parse '@' từ body. */
  id: string;
  /** Chuỗi chèn vào ô nhập: '@Tên_Hiển_Thị'. */
  tag: string;
  displayName: string;
  /** Xem được chat nội bộ — dùng để cảnh báo khi soạn chat nội bộ. */
  canViewInternal: boolean;
}

/**
 * Người có thể @-tag trong composer chat.
 *
 * Nguồn đúng là participant active của ticket (GET .../participants) — KHÔNG
 * phải tác giả đã chat: người mới được add vào ticket nhưng chưa nhắn gì vẫn
 * phải tag được.
 *
 * Chỉ lọc bỏ chính mình. Cố ý không lọc `canPost`/`canViewInternal` — BE
 * (ChatAddCommandHandler) validate mention duy nhất bằng "có phải participant
 * active không", nên lọc chặt hơn sẽ ẩn mất người mà BE vẫn cho mention.
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
