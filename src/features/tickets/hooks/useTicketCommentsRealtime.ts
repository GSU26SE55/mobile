import { useEffect, useRef, useState } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import { BASE_URL } from '@/src/lib/axios';
import { getAccessToken } from '@/src/lib/secureStore';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { useSessionStore } from '@/src/stores/sessionStore';
import { CursorPaginationResponse } from '@/src/types/api.types';
import { TicketCommentDTO } from '../types/ticket.types';
import type { ChatReaderDTO } from '../types/chat-actions.types';

const HUB_PATH = '/hubs/ticket-chats';
const TYPING_TIMEOUT = 3000;
const TYPING_THROTTLE = 1500; // at most 1 Typing invoke every 1.5s (avoids spamming the hub on every keystroke)

type CommentsPage = CursorPaginationResponse<TicketCommentDTO> | null;

export interface TypingUser {
  userId: string;
  displayName: string;
}

// Prepend a new comment to the first page (BE sorts DESC ⇒ newest first), dedup by id.
// Idempotent: if the id already exists on any page → leave unchanged (guards against
// duplicates when POST and realtime both arrive).
function prependComment(
  data: InfiniteData<CommentsPage> | undefined,
  dto: TicketCommentDTO,
): InfiniteData<CommentsPage> | undefined {
  if (!data) return data;
  const exists = data.pages.some((p) => p?.items?.some((c) => c.id === dto.id));
  if (exists) return data;
  const [first, ...rest] = data.pages;
  if (!first) return data;
  // GH-68: cursor page (CursorPaginationResponse) does NOT have totalItems → only prepend items,
  // don't touch totalItems (avoids NaN). CommentThread/screens don't read totalItems.
  const updatedFirst: CommentsPage = {
    ...first,
    items: [dto, ...first.items],
  };
  return { ...data, pages: [updatedFirst, ...rest] };
}

/** ChatRead payload — BE sends it ONLY to the author of the messages that were just read. */
interface ChatReadPayload {
  ticketId: string;
  readers?: ChatReaderDTO[];
}

/**
 * Merge incoming "seen" receipts into the cached comments.
 *
 * The payload carries only the receipts from ONE bulk-writer flush, not the full reader list,
 * so each chat's existing receipts are kept and matched by userId — overwriting would drop
 * everyone who read the message earlier.
 */
function mergeReadReceipts(
  data: InfiniteData<CommentsPage> | undefined,
  readers: ChatReaderDTO[],
): InfiniteData<CommentsPage> | undefined {
  if (!data) return data;

  const byChat = new Map<string, ChatReaderDTO[]>();
  for (const r of readers) {
    if (!r?.chatId) continue;
    const list = byChat.get(r.chatId);
    if (list) list.push(r);
    else byChat.set(r.chatId, [r]);
  }
  if (byChat.size === 0) return data;

  return {
    ...data,
    pages: data.pages.map((page) => {
      if (!page?.items) return page;
      let touched = false;
      const items = page.items.map((c) => {
        const incoming = byChat.get(c.id);
        if (!incoming) return c;
        touched = true;
        const merged = [...(c.readReceipts ?? [])];
        for (const r of incoming) {
          const at = merged.findIndex((m) => m.userId === r.userId);
          if (at >= 0) merged[at] = r;
          else merged.push(r);
        }
        return { ...c, readReceipts: merged, readCount: merged.length };
      });
      return touched ? { ...page, items } : page;
    }),
  };
}

// GH-44 #8 — realtime comments for ticket detail. Realtime is the MAIN UPDATE SOURCE:
// BE broadcasts "ChatAdded" (SignalRTicketChatNotifier.cs:33) to the ticket's group —
// including the SENDER too (SendAsync to Group, caller not excluded) → the sender also
// receives it back → setQueryData prepend (dedup by id), NO refetch needed.
// Connection errors are just swallowed — UI falls back entirely to REST (useTicketComments).
export function useTicketCommentsRealtime(ticketId: string | undefined) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    if (!ticketId) return;

    // BASE_URL has no /api (axios.ts) ⇒ concatenate directly; .replace just guards against an env with an /api suffix.
    const hubUrl = `${BASE_URL.replace(/\/api$/, '')}${HUB_PATH}`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => (await getAccessToken()) ?? '',
      })
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    // Event "ChatAdded" matches BE (SignalRTicketChatNotifier.cs:33). Customer can join the
    // public group; a public comment sent up → BE broadcasts ChatAdded to the group → prepend.
    // The unread badge in the header reads a separate key — new/deleted messages both change
    // the count, so it must be invalidated alongside, otherwise the badge is only correct when
    // the screen opens and then stays frozen.
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
      // BE broadcasts to the whole group, sender included, so a message the user just sent
      // comes straight back here. Refetching the unread count for it makes the badge blink up
      // and then drop again. Only the count for messages from OTHER people can have changed.
      // Read the store imperatively: putting accountId in the effect deps would rebuild the
      // SignalR connection whenever the session object changes identity.
      const myAccountId = useSessionStore.getState().user?.accountId;
      if (dto.authorUserId && dto.authorUserId === myAccountId) return;
      invalidateUnread();
    });

    // Edit/delete message (BE: "ChatEdited"/"ChatDeleted") — no usable payload to splice
    // directly into InfiniteData, so invalidate the whole list, simple & correct.
    const invalidateChats = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    };
    connection.on('ChatEdited', invalidateChats);
    connection.on('ChatDeleted', () => {
      invalidateChats();
      invalidateUnread();
    });

    // Reaction realtime (BE: "ReactionChanged", payload { chatId, reactions }). Mobile
    // displays reactions EMBEDDED in the comment within the chats(id) list (comment.reactions),
    // NOT via a separate chatReactions key like web → invalidate chats(id) so the list refetches the aggregate.
    connection.on('ReactionChanged', invalidateChats);

    // Pin/unpin (BE: "ChatPinChanged"). Pin state is shared across everyone viewing the
    // ticket — it drives the pinned bar above the thread — so it has to land without a manual
    // refresh. Same invalidate as edit/delete: the payload only carries the new flag, and the
    // comment lives inside an InfiniteData page here rather than its own cache entry.
    connection.on('ChatPinChanged', invalidateChats);

    // "Seen" receipts (Messenger-style). BE sends this ONLY to the author of the messages that
    // were read, and the payload holds just the NEW receipts from that flush — so merge into
    // the cache instead of refetching (a refetch would be one request per reader per flush).
    connection.on('ChatRead', (payload: ChatReadPayload) => {
      const readers = payload?.readers;
      if (!readers?.length) return;
      queryClient.setQueryData<InfiniteData<CommentsPage>>(
        QUERY_KEY.tickets.chats(ticketId!),
        (data) => mergeReadReceipts(data, readers),
      );
    });

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
    // Keep the start() promise so cleanup WAITS for it to settle before calling stop(). Calling
    // stop() while start() is still pending → SignalR throws "Failed to start the HttpConnection
    // before stop() was called" (seen during Fast Refresh / rapid remount).
    const startPromise = connection
      .start()
      .then(() => {
        if (cancelled) return undefined;
        setIsConnected(true);
        return connection.invoke('JoinTicket', ticketId);
      })
      .catch(() => {
        // swallow — fall back to REST
      });

    return () => {
      cancelled = true;
      Object.values(typingTimers.current).forEach(clearTimeout);
      typingTimers.current = {};
      const conn = connectionRef.current;
      connectionRef.current = null;
      if (conn) {
        // Remove handlers BEFORE stopping — prevents a lingering event from firing into a
        // connection mid-teardown (Fast Refresh remount), which would process
        // CommentAdded / UserTyping twice.
        conn.off('ChatAdded');
        conn.off('ChatEdited');
        conn.off('ChatDeleted');
        conn.off('ReactionChanged');
        conn.off('ChatPinChanged');
        conn.off('UserTyping');
        // WAIT for start() to finish before leave + stop — avoids stop-before-start.
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

  // Broadcast typing indicator (server uses OthersInGroup ⇒ the sender doesn't receive their own).
  // Throttle: at most 1 invoke per TYPING_THROTTLE to avoid calling the hub on every keystroke.
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
