import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '@/src/lib/queryKeys';
import { handleErrorApi } from '@/src/lib/errors';
import {
  chatInboxService,
  ChatInboxParams,
  MentionListParams,
} from '../services/chatInbox.service';

/**
 * Tổng số tin nhắn chưa đọc — dùng cho badge trên icon tab.
 *
 * BE đếm theo bản ghi chat nên tin có @mention ĐÃ nằm trong số này rồi.
 * KHÔNG cộng thêm useMyMentions() vào, sẽ bị đếm 2 lần cùng 1 tin.
 */
export function useChatUnreadCount() {
  return useQuery({
    queryKey: QUERY_KEY.chatsInbox.unreadCount(),
    queryFn: async () => {
      const res = await chatInboxService.getMyUnreadCount();
      return res.data.data ?? 0;
    },
    refetchInterval: 60_000, // badge cần tươi nhưng không cần realtime
  });
}

/**
 * Unread gom theo khách hàng → Map để tra O(1) khi render từng dòng.
 * Khách không có tin chưa đọc thì BE không trả về ⇒ tra Map ra undefined ⇒ 0.
 */
export function useUnreadByCustomer() {
  return useQuery({
    queryKey: QUERY_KEY.chatsInbox.unreadByCustomer(),
    queryFn: async () => {
      const res = await chatInboxService.getUnreadByCustomer();
      return new Map((res.data.data ?? []).map((x) => [x.customerId, x.unreadCount]));
    },
    refetchInterval: 60_000,
  });
}

// GH-68 — inbox chat tổng (FLAT list, BE không group theo ticket).
export function useMyChats(params?: ChatInboxParams) {
  const merged: ChatInboxParams = { pageSize: 20, ...params };
  return useQuery({
    queryKey: QUERY_KEY.chatsInbox.list(merged as Record<string, unknown>),
    queryFn: async () => {
      const res = await chatInboxService.getMyChats(merged);
      return res.data.data?.items ?? [];
    },
  });
}

// GH-68 — @mention tới mình. GH-866: BE bỏ param unreadOnly và endpoint acknowledge.
export function useMyMentions(params?: MentionListParams) {
  const merged: MentionListParams = { pageSize: 20, ...params };
  return useQuery({
    queryKey: QUERY_KEY.chatMentions.list(merged as Record<string, unknown>),
    queryFn: async () => {
      const res = await chatInboxService.getMyMentions(merged);
      return res.data.data?.items ?? [];
    },
  });
}

// GDPR — xóa nội dung toàn bộ chat của mình. Không hoàn tác → component confirm 2 bước.
export function useEraseMyChatData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatInboxService.eraseMyData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.tickets });
      queryClient.invalidateQueries({ queryKey: KEY.chatsInbox });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
