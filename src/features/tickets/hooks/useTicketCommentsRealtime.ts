import { useEffect, useRef, useState } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import { BASE_URL } from '../../../lib/axios';
import { getAccessToken } from '../../../lib/secureStore';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { CursorPaginationResponse } from '../../../types/api.types';
import { TicketCommentDTO } from '../types/ticket.types';

const HUB_PATH = '/hubs/ticket-chats';
const TYPING_TIMEOUT = 3000;
const TYPING_THROTTLE = 1500; // tối đa 1 lần invoke Typing mỗi 1.5s (tránh spam hub mỗi keystroke)

type CommentsPage = CursorPaginationResponse<TicketCommentDTO> | null;

export interface TypingUser {
  userId: string;
  displayName: string;
}

// Prepend comment mới vào page đầu (BE sort DESC ⇒ mới nhất lên đầu), dedup theo id.
// Idempotent: nếu id đã tồn tại ở bất kỳ page nào → giữ nguyên (chống trùng khi POST + realtime cùng về).
function prependComment(
  data: InfiniteData<CommentsPage> | undefined,
  dto: TicketCommentDTO,
): InfiniteData<CommentsPage> | undefined {
  if (!data) return data;
  const exists = data.pages.some((p) => p?.items?.some((c) => c.id === dto.id));
  if (exists) return data;
  const [first, ...rest] = data.pages;
  if (!first) return data;
  // GH-68: cursor page (CursorPaginationResponse) KHÔNG có totalItems → chỉ prepend items,
  // không đụng totalItems (tránh NaN). CommentThread/screens không đọc totalItems.
  const updatedFirst: CommentsPage = {
    ...first,
    items: [dto, ...first.items],
  };
  return { ...data, pages: [updatedFirst, ...rest] };
}

// GH-44 #8 — realtime comment cho ticket detail. Realtime là NGUỒN CẬP NHẬT CHÍNH:
// BE broadcast "ChatAdded" (SignalRTicketChatNotifier.cs:33) tới group của ticket —
// gồm CẢ người gửi (SendAsync tới Group, không loại caller) → người gửi cũng nhận lại
// → setQueryData prepend (dedup theo id), KHÔNG cần refetch.
// Lỗi connect chỉ swallow — UI fallback hoàn toàn về REST (useTicketComments).
export function useTicketCommentsRealtime(ticketId: string | undefined) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    if (!ticketId) return;

    // BASE_URL không có /api (axios.ts) ⇒ ghép thẳng; .replace chỉ phòng trường hợp env có đuôi /api.
    const hubUrl = `${BASE_URL.replace(/\/api$/, '')}${HUB_PATH}`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => (await getAccessToken()) ?? '',
      })
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    // Event "ChatAdded" khớp BE (SignalRTicketChatNotifier.cs:33). Customer join được
    // public group; comment public gửi lên → BE broadcast ChatAdded về group → prepend.
    // Badge chưa đọc ở header đọc key riêng — tin đến/bị xóa đều làm số đổi, phải
    // invalidate kèm, không thì badge chỉ đúng lúc mở màn hình rồi đứng yên.
    const invalidateUnread = () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
      });
    };

    connection.on('ChatAdded', (dto: TicketCommentDTO) => {
      queryClient.setQueryData<InfiniteData<CommentsPage>>(
        QUERY_KEY.tickets.chats(ticketId),
        (data) => prependComment(data, dto),
      );
      invalidateUnread();
    });

    // Sửa/xóa tin nhắn (BE: "ChatEdited"/"ChatDeleted") — không có payload dùng được để
    // splice trực tiếp vào InfiniteData nên invalidate cả list, đơn giản & đúng.
    const invalidateChats = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    };
    connection.on('ChatEdited', invalidateChats);
    connection.on('ChatDeleted', () => {
      invalidateChats();
      invalidateUnread();
    });

    // Reaction realtime (BE: "ReactionChanged", payload { chatId, reactions }). Mobile
    // hiển thị reactions NHÚNG trong comment của list chats(id) (comment.reactions), KHÔNG
    // dùng key chatReactions riêng như web → invalidate chats(id) để list refetch aggregate.
    connection.on('ReactionChanged', invalidateChats);

    connection.on('UserTyping', (_ticketId: string, userId: string, displayName: string) => {
      setTypingUsers((prev) =>
        prev.some((u) => u.userId === userId) ? prev : [...prev, { userId, displayName }],
      );
      if (typingTimers.current[userId]) clearTimeout(typingTimers.current[userId]);
      typingTimers.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        delete typingTimers.current[userId];
      }, TYPING_TIMEOUT);
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      connection.invoke('JoinTicket', ticketId).catch(() => {});
    });
    connection.onclose(() => setIsConnected(false));

    let cancelled = false;
    // Giữ promise start() để cleanup CHỜ nó settle trước khi stop(). Gọi stop() khi
    // start() còn pending → SignalR ném "Failed to start the HttpConnection before
    // stop() was called" (lỗi thấy khi Fast Refresh / remount nhanh).
    const startPromise = connection
      .start()
      .then(() => {
        if (cancelled) return undefined;
        setIsConnected(true);
        return connection.invoke('JoinTicket', ticketId);
      })
      .catch(() => {
        // swallow — fallback REST
      });

    return () => {
      cancelled = true;
      Object.values(typingTimers.current).forEach(clearTimeout);
      typingTimers.current = {};
      const conn = connectionRef.current;
      connectionRef.current = null;
      if (conn) {
        // Gỡ handler TRƯỚC khi stop — chống event treo bắn vào connection đang
        // teardown (Fast Refresh remount) gây xử lý CommentAdded / UserTyping 2 lần.
        conn.off('ChatAdded');
        conn.off('ChatEdited');
        conn.off('ChatDeleted');
        conn.off('ReactionChanged');
        conn.off('UserTyping');
        // CHỜ start() xong rồi mới leave + stop — tránh stop-trước-start.
        void startPromise.finally(() => {
          if (conn.state === signalR.HubConnectionState.Connected) {
            conn
              .invoke('LeaveTicket', ticketId)
              .catch(() => {})
              .finally(() => conn.stop().catch(() => {}));
          } else {
            conn.stop().catch(() => {});
          }
        });
      }
      setIsConnected(false);
      setTypingUsers([]);
    };
  }, [ticketId, queryClient]);

  // Broadcast typing indicator (server dùng OthersInGroup ⇒ người gửi không tự nhận lại).
  // Throttle: tối đa 1 invoke mỗi TYPING_THROTTLE để không gọi hub mỗi keystroke.
  const notifyTyping = () => {
    const conn = connectionRef.current;
    if (!ticketId || !conn || conn.state !== signalR.HubConnectionState.Connected) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_THROTTLE) return;
    lastTypingSentRef.current = now;
    conn.invoke('Typing', ticketId).catch(() => {});
  };

  return { isConnected, typingUsers, notifyTyping };
}
