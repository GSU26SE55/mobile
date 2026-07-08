import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '../../../lib/queryKeys';
import { handleErrorApi } from '../../../lib/errors';
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

// GH-68 — @mention tới mình. unreadOnly để lọc chưa đọc.
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

export function useAcknowledgeMention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatInboxService.acknowledgeMention(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.chatMentions });
    },
    onError: (error) => handleErrorApi({ error }),
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
