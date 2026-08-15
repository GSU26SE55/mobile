import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '@/src/lib/date';
import { Colors } from '@/src/lib/theme';
import { ChatBubble } from './ChatBubble';
import { ReactionTypeEnum, TicketCommentDTO } from '../types/ticket.types';
import type { OutboxMessage } from '../types/chat-outbox.types';

export type ChatTab = 'public' | 'internal';

// Mirror BE ChatOptions.EditWindowMinutes (15) — only used for a UI hint, BE is always
// the final source of truth.
const EDIT_WINDOW_MS = 15 * 60 * 1000;

type ThreadItem =
  | { kind: 'comment'; key: string; comment: TicketCommentDTO }
  | { kind: 'date'; key: string; label: string }
  | { kind: 'unread'; key: string; count: number }
  | { kind: 'pending'; key: string; message: OutboxMessage };

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return formatDate(d);
}

// `comments` passed in keeps the DESC order (newest first) as returned by BE — do NOT
// reverse it here. FlatList `inverted` automatically anchors the first element (newest) to
// the bottom of the screen and pushes older elements up, matching standard chat UI
// (Messenger/Zalo...). This way new comments from realtime (prepended at index 0) also
// automatically appear at the bottom without a manual scrollToEnd.
/**
 * Index of the OLDEST unread message in the ASC array (old → new) — the FIRST unread
 * message encountered. Only computed when BE returns `isRead`; `undefined` (realtime
 * ChatAdded doesn't include the field) is skipped to avoid drawing the marker incorrectly.
 */
function findOldestUnreadIndex(ascComments: TicketCommentDTO[]): number {
  return ascComments.findIndex((c) => c.isRead === false);
}

/**
 * `anchorId` — id of the oldest unread message pinned for this viewing session (see CommentThread).
 * null ⇒ don't draw the marker.
 * `unreadCount` — number of unread messages captured at the same time as the anchor. Counting
 * by the marker's POSITION (ascComments.length - oldestUnread) would include every message that
 * arrives afterwards — even the ones the current user sends themselves — so the badge kept
 * counting up while the sender was looking at their own messages.
 */
function buildThreadItems(
  ascComments: TicketCommentDTO[],
  anchorId: string | null,
  unreadCount: number,
): ThreadItem[] {
  const items: ThreadItem[] = [];
  let lastDay: string | null = null;

  const oldestUnread = anchorId ? ascComments.findIndex((c) => c.id === anchorId) : -1;

  ascComments.forEach((c, i) => {
    const day = dayKey(c.createdAt);
    if (day !== lastDay) {
      items.push({ kind: 'date', key: `date-${day}`, label: formatDateLabel(c.createdAt) });
      lastDay = day;
    }

    // Marker placed RIGHT BEFORE the oldest unread message — ASC data + non-inverted list ⇒
    // everything BELOW the line is unread, matching the Slack/Messenger standard.
    if (i === oldestUnread) {
      items.push({ kind: 'unread', key: 'unread-divider', count: unreadCount });
    }

    items.push({ kind: 'comment', key: c.id ?? `comment-${i}`, comment: c });
  });

  return items;
}

interface CommentThreadProps {
  comments: TicketCommentDTO[];
  currentUserId?: string | null;
  imageHeaders?: { Authorization: string };
  onImagePress: (uri: string) => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  emptyText?: string;
  accentColor?: string;

  // Public/Internal tabs — opt-in (Staff enables, Customer doesn't pass it → single list as before).
  showTabs?: boolean;
  activeTab?: ChatTab;
  onTabChange?: (tab: ChatTab) => void;

  // Edit/Delete/Translate/Mark-read — opt-in similarly, off by default.
  ticketClosed?: boolean;
  onEdit?: (comment: TicketCommentDTO, body: string, editReason?: string) => void;
  onDelete?: (comment: TicketCommentDTO, reason?: string) => void;
  editPending?: boolean;
  deletePending?: boolean;
  /**
   * Multi-select mode to delete messages (DELETE /chats/bulk). Only messages from ONESELF
   * show a checkbox — other people's messages get "hidden for me" by BE instead of being
   * deleted, which would be confusing. Having `onRequestSelectMode` enables "Select multiple"
   * in the long-press menu.
   */
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (comment: TicketCommentDTO) => void;
  onRequestSelectMode?: (comment: TicketCommentDTO) => void;
  /** Housekeeping — marks the currently displayed chats as read (no unread badge to wire up) */
  onMarkRead?: (chatIds: string[]) => void;
  /** Every role can translate (BE doesn't restrict this) — passing this prop shows the translate menu */
  onTranslate?: (
    comment: TicketCommentDTO,
    targetLanguage: string,
  ) => Promise<{ translatedBody: string; targetLanguage: string } | undefined>;
  // GH-67 — Pin (Staff/Manager/Admin). Only shows the pin menu when both onPin + onUnpin are provided.
  onPin?: (comment: TicketCommentDTO) => void;
  /** Staff/Manager/Admin only — opens the "read by" list. Customer does NOT pass this (BE 403). */
  onShowReaders?: (comment: TicketCommentDTO) => void;
  onUnpin?: (comment: TicketCommentDTO) => void;
  pinningId?: string | null;
  // GH-68 — Reactions + download attachment (all roles). Passing the prop enables the feature.
  onToggleReaction?: (comment: TicketCommentDTO, type: ReactionTypeEnum, isActive: boolean) => void;
  onDownloadAttachments?: (comment: TicketCommentDTO, fileIds: string[]) => void;

  // GH-133 — AI suggestion shown as a bubble at the END of the chat thread (like web). Tapping
  // one fills the input (onPickSuggestion) without clearing it; dismiss the suggestion group via
  // onDismissSuggestions.
  aiSuggestions?: string[];
  onPickSuggestion?: (text: string) => void;
  onDismissSuggestions?: () => void;

  // Chat outbox — messages waiting to send, rendered as an optimistic bubble at the end of
  // the thread (mirrors Web's PendingBubble). Opt-in — off when not passed.
  pendingMessages?: OutboxMessage[];
  onRetryPending?: (tempId: string) => void;
  onDiscardPending?: (tempId: string) => void;
}

/**
 * Bubble for a message waiting to send (outbox) — looks like the sender's own bubble (right
 * side), the only difference is the bottom line: status instead of timestamp.
 *  - queued/sending: "Sending…" (gray) — still shown this way during a silent retry.
 *  - failed (timed out): "⚠ Send failed · Tap to retry" (red) — tap to resend that message.
 * Mirrors Web's PendingBubble in TicketCommentThread.tsx.
 */
function PendingBubble({
  message,
  accentColor = Colors.primary,
  onRetry,
  onDiscard,
}: {
  message: OutboxMessage;
  accentColor?: string;
  onRetry?: (tempId: string) => void;
  onDiscard?: (tempId: string) => void;
}) {
  const failed = message.status === 'failed';
  const attachCount = message.payload.attachments?.length ?? 0;
  return (
    <View style={styles.pendingRow}>
      <View style={styles.pendingStack}>
        <View style={[styles.pendingBubble, { backgroundColor: accentColor }]}>
          <Text style={styles.pendingBubbleText}>{message.payload.body}</Text>
        </View>
        {attachCount > 0 && (
          <Text style={styles.pendingMeta}>{attachCount} attachments</Text>
        )}
        {failed ? (
          <View style={styles.pendingStatusRow}>
            {/* Has failReason = BE rejected it due to content (e.g. duplicate message) →
                resending would fail too, so state the reason instead of a pointless retry. */}
            {message.failReason ? (
              <Text style={styles.pendingFailText}>⚠ {message.failReason}</Text>
            ) : (
              <Pressable onPress={() => onRetry?.(message.tempId)} hitSlop={4}>
                <Text style={styles.pendingFailText}>⚠ Send failed · Tap to retry</Text>
              </Pressable>
            )}
            <Pressable onPress={() => onDiscard?.(message.tempId)} hitSlop={4}>
              <Text style={styles.pendingDiscardText}>Discard</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.pendingMeta}>Sending…</Text>
        )}
      </View>
    </View>
  );
}

/** Chat list shared by customer + staff — top to bottom, pull to load older history. */
export function CommentThread({
  comments,
  currentUserId,
  imageHeaders,
  onImagePress,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  emptyText = 'No messages yet.',
  accentColor,
  showTabs = false,
  activeTab,
  onTabChange,
  ticketClosed = false,
  onEdit,
  onDelete,
  editPending = false,
  deletePending = false,
  selectMode = false,
  selectedIds,
  onToggleSelect,
  onRequestSelectMode,
  onMarkRead,
  onTranslate,
  onPin,
  onShowReaders,
  onUnpin,
  pinningId,
  onToggleReaction,
  onDownloadAttachments,
  aiSuggestions = [],
  onPickSuggestion,
  onDismissSuggestions,
  pendingMessages = [],
  onRetryPending,
  onDiscardPending,
}: CommentThreadProps) {
  const [internalTab, setInternalTab] = useState<ChatTab>('public');
  const tab = activeTab ?? internalTab;
  const setTab = (t: ChatTab) => {
    setInternalTab(t);
    onTabChange?.(t);
  };

  // Pending (outbox) messages belonging to the current tab — optimistic bubble at the end of the thread.
  const pendingForTab = useMemo(
    () =>
      showTabs
        ? pendingMessages.filter((m) => (tab === 'internal' ? m.payload.isInternal : !m.payload.isInternal))
        : pendingMessages,
    [pendingMessages, showTabs, tab],
  );

  const publicCount = useMemo(() => comments.filter((c) => !c.isInternal).length, [comments]);
  const internalCount = comments.length - publicCount;

  const visible = useMemo(
    () => (showTabs ? comments.filter((c) => (tab === 'internal' ? c.isInternal : !c.isInternal)) : comments),
    [comments, showTabs, tab],
  );

  // The marker must STAY FIXED throughout the viewing session. onMarkRead below marks
  // messages as read as soon as the chat opens ⇒ once the refetch completes every isRead
  // becomes true; if the marker were recomputed from the new data, the line that just
  // appeared would vanish before Staff even notices where they were reading from. So the id
  // of the oldest unread message is pinned on the FIRST render with data and kept until the
  // tab changes / the screen is left.
  const anchorIdRef = useRef<string | null>(null);
  const anchorCountRef = useRef(0);
  const anchorResolvedRef = useRef(false);

  useEffect(() => {
    anchorIdRef.current = null;
    anchorCountRef.current = 0;
    anchorResolvedRef.current = false;
  }, [tab]);

  const items = useMemo(() => {
    const ascComments = [...visible].reverse();

    if (!anchorResolvedRef.current) {
      // Only pin the marker once BE has returned isRead for at least 1 message — avoids
      // incorrectly pinning "no marker" when the list only has realtime messages so far
      // (isRead undefined).
      const hasReadInfo = ascComments.some((c) => c.isRead !== undefined);
      if (hasReadInfo) {
        const idx = findOldestUnreadIndex(ascComments);
        anchorIdRef.current = idx >= 0 ? ascComments[idx].id : null;
        // Pinned at the same time as the anchor so later messages (including the user's own)
        // don't inflate the count — see buildThreadItems.
        anchorCountRef.current = ascComments.filter((c) => c.isRead === false).length;
        anchorResolvedRef.current = true;
      }
    }

    const base = buildThreadItems(ascComments, anchorIdRef.current, anchorCountRef.current);
    // Pending (outbox) messages render after the real ones — newest-last, matching Web's
    // PendingBubble placement at the end of the thread.
    const pending: ThreadItem[] = pendingForTab.map((m) => ({
      kind: 'pending',
      key: `pending-${m.tempId}`,
      message: m,
    }));
    return [...base, ...pending];
  }, [visible, pendingForTab]);

  // Always scroll to the newest message (the bottom). Non-inverted list + ASC data ⇒ bottom
  // = newest message. onContentSizeChange fires on mount, on data load, on new messages, and
  // when the AI suggestion bubble appears ⇒ entering/re-entering the chat always lands at the
  // bottom. Blocked while loading an OLDER page (pull to refresh) to avoid yanking the user
  // away from their current reading position.
  const listRef = useRef<FlatList>(null);

  // Position of the "Unread messages" marker in `items` — scroll target when opening a chat that still has unread messages.
  const unreadIndex = useMemo(() => items.findIndex((it) => it.kind === 'unread'), [items]);

  // Only auto-scroll to the marker ONCE per chat opening. Without this flag, every
  // onContentSizeChange fire (new message, image finished loading…) would yank the user back
  // up to the old marker.
  const jumpedToUnreadRef = useRef(false);
  useEffect(() => {
    jumpedToUnreadRef.current = false;
  }, [tab]);

  const scrollToBottom = (animated: boolean) => {
    if (isFetchingNextPage) return;

    // Still has unread messages → prefer jumping to the marker instead of the bottom, so
    // Staff reads starting from the oldest unread message onward. viewPosition 0.15 leaves
    // the marker slightly above the top edge for visibility.
    if (unreadIndex >= 0 && !jumpedToUnreadRef.current) {
      jumpedToUnreadRef.current = true;
      listRef.current?.scrollToIndex({ index: unreadIndex, animated, viewPosition: 0.15 });
      return;
    }

    listRef.current?.scrollToEnd({ animated });
  };

  // AI suggestion generation done (bubble appears at the end of the chat) → scroll down so
  // the user sees it right away. Ensures this happens even if onContentSizeChange doesn't fire in time.
  useEffect(() => {
    if (aiSuggestions.length === 0) return;
    const t = setTimeout(() => scrollToBottom(true), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiSuggestions.length]);

  // Housekeeping — marks currently displayed comments in the active tab as read, once per id.
  const markedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!onMarkRead) return;
    const unmarked = visible.map((c) => c.id).filter((id) => !markedRef.current.has(id));
    if (unmarked.length === 0) return;
    unmarked.forEach((id) => markedRef.current.add(id));
    onMarkRead(unmarked);
  }, [visible, onMarkRead]);

  // "now" updated periodically — avoids calling Date.now() directly on every render when computing the edit window.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);


  // Translations kept locally by chatId — allows toggling original/translated without calling BE again.
  const [translations, setTranslations] = useState<Record<string, { lang: string; text: string }>>({});
  const [showOriginalIds, setShowOriginalIds] = useState<Set<string>>(new Set());
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const handleTranslate = async (comment: TicketCommentDTO, lang: string) => {
    if (!onTranslate) return;
    setTranslatingId(comment.id);
    try {
      const result = await onTranslate(comment, lang);
      if (result) {
        setTranslations((prev) => ({ ...prev, [comment.id]: { lang: result.targetLanguage, text: result.translatedBody } }));
        setShowOriginalIds((prev) => {
          if (!prev.has(comment.id)) return prev;
          const next = new Set(prev);
          next.delete(comment.id);
          return next;
        });
      }
    } finally {
      setTranslatingId(null);
    }
  };

  const toggleShowOriginal = (chatId: string) => {
    setShowOriginalIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {showTabs && (
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabBtn, tab === 'public' && styles.tabBtnActivePublic]}
            onPress={() => setTab('public')}
          >
            <Ionicons name="earth-outline" size={14} color={tab === 'public' ? Colors.primaryDark : Colors.textMute} />
            <Text style={[styles.tabBtnText, tab === 'public' && styles.tabBtnTextActivePublic]}>
              Public ({publicCount})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, tab === 'internal' && styles.tabBtnActiveInternal]}
            onPress={() => setTab('internal')}
          >
            <Ionicons name="lock-closed-outline" size={14} color={tab === 'internal' ? Colors.warningDark : Colors.textMute} />
            <Text style={[styles.tabBtnText, tab === 'internal' && styles.tabBtnTextActiveInternal]}>
              Internal ({internalCount})
            </Text>
          </Pressable>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={36} color={Colors.textFaint} />
          <Text style={styles.emptyText}>
            {showTabs ? (tab === 'public' ? 'No public messages yet.' : 'No internal messages yet.') : emptyText}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.list}
          data={items}
          keyExtractor={(item) => item.key}
          onContentSizeChange={() => scrollToBottom(false)}
          keyboardDismissMode="on-drag"
          // No getItemLayout (bubbles have varying heights) so scrollToIndex can drift when
          // the target item hasn't rendered yet — scroll approximately then retry the exact index.
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: false,
            });
            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: false,
                viewPosition: 0.15,
              });
            }, 80);
          }}
          renderItem={({ item }) => {
            if (item.kind === 'date') {
              return (
                <View style={styles.dateRow}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateLabel}>{item.label}</Text>
                  <View style={styles.dateLine} />
                </View>
              );
            }
            if (item.kind === 'unread') {
              return (
                <View style={styles.unreadRow}>
                  <View style={styles.unreadLine} />
                  <View style={styles.unreadPill}>
                    <Ionicons name="arrow-down" size={11} color="#FFF" />
                    <Text style={styles.unreadLabel}>
                      {item.count > 1 ? `${item.count} unread messages` : 'Unread message'}
                    </Text>
                  </View>
                  <View style={styles.unreadLine} />
                </View>
              );
            }
            if (item.kind === 'pending') {
              return (
                <PendingBubble
                  message={item.message}
                  accentColor={accentColor}
                  onRetry={onRetryPending}
                  onDiscard={onDiscardPending}
                />
              );
            }
            const comment = item.comment;
            const isOwn = !!currentUserId && comment.authorUserId === currentUserId;
            const authorWindowOk = isOwn && now - new Date(comment.createdAt).getTime() <= EDIT_WINDOW_MS;
            // Only the author can edit/delete their own message — higher roles do NOT override
            // this. Matches BE's ChatAuthorizationService.CanEditChat/CanDeleteChat: it accepts
            // actorPermissions but doesn't read it, only compares AuthorUserId. Gating the
            // button on chat.edit.any/chat.delete.any like before would get a 403 on tap.
            const canEdit = !ticketClosed && authorWindowOk && !!onEdit;
            const canDelete = !ticketClosed && isOwn && !!onDelete;
            const canPin = !ticketClosed && !!onPin && !!onUnpin;
            const canShowReaders = !!onShowReaders;
            // The "reason" field only makes sense when editing/deleting SOMEONE ELSE'S
            // message — and no role can do that anymore, so it's always off. The prop is kept
            // on ChatBubble so an Admin override path (ticket already Closed, via a separate
            // endpoint) still has somewhere to plug in.
            const editNeedsReason = false;
            const deleteNeedsReason = false;
            // Only my own messages are selectable — other people's messages are handled by
            // BE via "hide for me" rather than delete, so they're not part of this flow.
            const selectable = isOwn && !ticketClosed && !!onToggleSelect;

            const bubble = (
              <ChatBubble
                comment={comment}
                isMe={isOwn}
                imageHeaders={imageHeaders}
                onImagePress={onImagePress}
                accentColor={accentColor}
                canEdit={canEdit}
                canDelete={canDelete}
                editNeedsReason={editNeedsReason}
                deleteNeedsReason={deleteNeedsReason}
                editPending={editPending}
                deletePending={deletePending}
                onEdit={(body, reason) => onEdit?.(comment, body, reason)}
                onDelete={(reason) => onDelete?.(comment, reason)}
                canTranslate={!!onTranslate}
                translating={translatingId === comment.id}
                onTranslate={(lang) => handleTranslate(comment, lang)}
                translation={translations[comment.id]}
                showingOriginal={!translations[comment.id] || showOriginalIds.has(comment.id)}
                onToggleOriginal={() => toggleShowOriginal(comment.id)}
                canPin={canPin}
                canShowReaders={canShowReaders}
                onShowReaders={() => onShowReaders?.(comment)}
                pinning={pinningId === comment.id}
                onTogglePin={() => (comment.isPinned ? onUnpin?.(comment) : onPin?.(comment))}
                currentUserId={currentUserId}
                onToggleReaction={
                  onToggleReaction
                    ? (type, isActive) => onToggleReaction(comment, type, isActive)
                    : undefined
                }
                onDownloadAttachments={
                  onDownloadAttachments
                    ? (fileIds) => onDownloadAttachments(comment, fileIds)
                    : undefined
                }
                canSelectMany={selectable && !!onRequestSelectMode}
                onRequestSelectMode={() => onRequestSelectMode?.(comment)}
              />
            );

            if (!selectMode) return bubble;

            const checked = !!selectedIds?.has(comment.id);
            return (
              <Pressable
                style={styles.selectRow}
                onPress={selectable ? () => onToggleSelect?.(comment) : undefined}
                // Other people's messages: no checkbox, dimmed to make it clear they're not selectable.
                accessibilityRole="checkbox"
                accessibilityState={{ checked, disabled: !selectable }}
              >
                <View style={styles.selectBox}>
                  {selectable ? (
                    <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                      {checked && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                  ) : null}
                </View>
                <View style={[styles.selectBubble, !selectable && styles.selectBubbleDim]}>
                  {bubble}
                </View>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            isFetchingNextPage ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Colors.textMute} />
              </View>
            ) : null
          }
          ListFooterComponent={
            aiSuggestions.length > 0 ? (
              <View style={styles.aiWrap}>
                <View style={styles.aiHeader}>
                  <Ionicons name="sparkles" size={13} color={Colors.primaryDark} />
                  <Text style={styles.aiHeaderText}>AI reply suggestions — tap to insert into the input</Text>
                </View>
                {aiSuggestions.map((s, i) => (
                  <Pressable
                    key={i}
                    style={styles.aiBubble}
                    onPress={() => onPickSuggestion?.(s)}
                  >
                    <Text style={styles.aiBubbleText}>{s}</Text>
                  </Pressable>
                ))}
                <Pressable hitSlop={6} onPress={() => onDismissSuggestions?.()}>
                  <Text style={styles.aiDismiss}>Dismiss suggestions</Text>
                </Pressable>
              </View>
            ) : null
          }
          refreshing={isFetchingNextPage}
          onRefresh={() => {
            if (hasNextPage && !isFetchingNextPage) onLoadMore?.();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  emptyText: { color: Colors.textFaint, fontSize: 14, fontWeight: '500' },
  list: { flex: 1 },
  // FlatList inverted flips the vertical axis ⇒ this style's paddingTop shows at the BOTTOM
  // (next to the composer) and paddingBottom shows at the TOP (next to the tab bar) — set counterintuitively.
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 },
  // Selection mode — checkbox on the left column, bubble keeps its original layout on the right.
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectBox: { width: 24, alignItems: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // primaryDark instead of primary: a white checkmark on yellow #FFD500 would be nearly unreadable.
  checkboxOn: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  selectBubble: { flex: 1 },
  selectBubbleDim: { opacity: 0.45 },
  loadingMore: { paddingVertical: 14, alignItems: 'center' },

  // Outbox — optimistic bubble for a message waiting to send, right-aligned like the sender's own bubble.
  pendingRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  pendingStack: { gap: 4, maxWidth: '78%', alignItems: 'flex-end' },
  pendingBubble: {
    borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    opacity: 0.65,
  },
  pendingBubbleText: { fontSize: 13.5, fontWeight: '500', color: Colors.text, lineHeight: 19 },
  pendingMeta: { fontSize: 10.5, color: Colors.textMute, paddingHorizontal: 4 },
  pendingStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  pendingFailText: { fontSize: 10.5, color: Colors.danger, fontWeight: '600' },
  pendingDiscardText: { fontSize: 10.5, color: Colors.textMute, textDecorationLine: 'underline' },

  // AI suggestion — bubble cluster at the end of the chat, right-aligned (chat sender's side) like web.
  aiWrap: { alignItems: 'flex-end', gap: 6, paddingTop: 6 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 2 },
  aiHeaderText: { fontSize: 11, fontWeight: '700', color: Colors.textMute },
  aiBubble: {
    maxWidth: '85%',
    backgroundColor: Colors.primaryLight, borderRadius: 16, borderBottomRightRadius: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  aiBubbleText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  aiDismiss: { fontSize: 11, color: Colors.textMute, textDecorationLine: 'underline', paddingTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dateLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMute },

  // "Unread messages" marker — red to stand out clearly from the (gray) date divider.
  unreadRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  unreadLine:  { flex: 1, height: 1.5, backgroundColor: '#FF3B30' },
  unreadPill:  {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FF3B30', borderRadius: 10,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  unreadLabel: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  tabBar: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
  },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: Colors.card2,
  },
  tabBtnActivePublic: { backgroundColor: Colors.primaryLight },
  tabBtnActiveInternal: { backgroundColor: Colors.warningLight },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMute },
  tabBtnTextActivePublic: { color: Colors.primaryDark },
  tabBtnTextActiveInternal: { color: Colors.warningDark },
});
