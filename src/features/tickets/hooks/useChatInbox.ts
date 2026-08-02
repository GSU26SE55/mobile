import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '@/src/lib/queryKeys';
import { handleErrorApi } from '@/src/lib/errors';
import {
  chatInboxService,
  ChatInboxParams,
  MentionListParams,
} from '../services/chatInbox.service';

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
