import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../lib/theme';
import { ChatBubble } from './ChatBubble';
import { ReactionTypeEnum, TicketCommentDTO } from '../types/ticket.types';

export type ChatTab = 'public' | 'internal';

// Mirror BE ChatOptions.EditWindowMinutes (15) — chỉ dùng để gợi ý UI, BE luôn
// là nguồn xác thực cuối cùng.
const EDIT_WINDOW_MS = 15 * 60 * 1000;

type ThreadItem =
  | { kind: 'comment'; key: string; comment: TicketCommentDTO }
  | { kind: 'date'; key: string; label: string };

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
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// `comments` truyền vào giữ nguyên thứ tự DESC (mới nhất trước) như BE trả về — KHÔNG
// đảo lại ở đây. FlatList `inverted` tự neo phần tử đầu (mới nhất) xuống đáy màn hình và
// đẩy các phần tử cũ hơn lên trên, đúng chuẩn UI chat (Messenger/Zalo...). Nhờ vậy comment
// mới từ realtime (prepend ở index 0) cũng tự xuất hiện ở đáy mà không cần scrollToEnd thủ công.
function buildThreadItems(comments: TicketCommentDTO[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  let lastDay: string | null = null;

  comments.forEach((c, i) => {
    const day = dayKey(c.createdAt);
    if (day !== lastDay) {
      items.push({ kind: 'date', key: `date-${day}`, label: formatDateLabel(c.createdAt) });
      lastDay = day;
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

  // Tab Công khai/Nội bộ — opt-in (Staff bật, Customer không truyền → 1 danh sách như cũ).
  showTabs?: boolean;
  activeTab?: ChatTab;
  onTabChange?: (tab: ChatTab) => void;

  // Sửa/Xóa/Dịch/Mark-read — opt-in tương tự, mặc định tắt hết.
  canEditAny?: boolean;
  canDeleteAny?: boolean;
  ticketClosed?: boolean;
  onEdit?: (comment: TicketCommentDTO, body: string, editReason?: string) => void;
  onDelete?: (comment: TicketCommentDTO, reason?: string) => void;
  editPending?: boolean;
  deletePending?: boolean;
  /**
   * Chế độ chọn nhiều tin để xoá (DELETE /chats/bulk). Chỉ tin của CHÍNH MÌNH mới
   * hiện checkbox — tin người khác sẽ bị BE "ẩn riêng" thay vì xoá, gây hiểu nhầm.
   * Có `onRequestSelectMode` là bật mục "Chọn nhiều" trong menu long-press.
   */
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (comment: TicketCommentDTO) => void;
  onRequestSelectMode?: (comment: TicketCommentDTO) => void;
  /** Housekeeping — báo đã đọc các chat đang hiển thị (không có unread badge để wire) */
  onMarkRead?: (chatIds: string[]) => void;
  /** Mọi role đều được dịch (BE không giới hạn quyền) — có prop này là hiện menu dịch */
  onTranslate?: (
    comment: TicketCommentDTO,
    targetLanguage: string,
  ) => Promise<{ translatedBody: string; targetLanguage: string } | undefined>;
  // GH-67 — Ghim (Staff/Manager/Admin). Có đủ onPin + onUnpin mới hiện menu ghim.
  onPin?: (comment: TicketCommentDTO) => void;
  /** Staff/Manager/Admin only — mở danh sách "đã đọc bởi". Customer KHÔNG truyền (BE 403). */
  onShowReaders?: (comment: TicketCommentDTO) => void;
  onUnpin?: (comment: TicketCommentDTO) => void;
  pinningId?: string | null;
  // GH-68 — Reactions + download attachment (Mọi role). Có prop là bật tính năng.
  onToggleReaction?: (comment: TicketCommentDTO, type: ReactionTypeEnum, isActive: boolean) => void;
  onDownloadAttachments?: (comment: TicketCommentDTO, fileIds: string[]) => void;

  // GH-133 — Gợi ý AI hiển thị dạng bong bóng CUỐI luồng chat (giống web). Bấm chọn →
  // đổ vào ô nhập (onPickSuggestion), không xóa; đóng cụm gợi ý qua onDismissSuggestions.
  aiSuggestions?: string[];
  onPickSuggestion?: (text: string) => void;
  onDismissSuggestions?: () => void;
}

/** Danh sách chat dùng chung customer + staff — từ trên xuống dưới, kéo để tải thêm lịch sử cũ. */
export function CommentThread({
  comments,
  currentUserId,
  imageHeaders,
  onImagePress,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  emptyText = 'Chưa có trao đổi nào.',
  accentColor,
  showTabs = false,
  activeTab,
  onTabChange,
  canEditAny = false,
  canDeleteAny = false,
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
}: CommentThreadProps) {
  const [internalTab, setInternalTab] = useState<ChatTab>('public');
  const tab = activeTab ?? internalTab;
  const setTab = (t: ChatTab) => {
    setInternalTab(t);
    onTabChange?.(t);
  };

  const publicCount = useMemo(() => comments.filter((c) => !c.isInternal).length, [comments]);
  const internalCount = comments.length - publicCount;

  const visible = useMemo(
    () => (showTabs ? comments.filter((c) => (tab === 'internal' ? c.isInternal : !c.isInternal)) : comments),
    [comments, showTabs, tab],
  );

  const items = useMemo(() => {
    const ascComments = [...visible].reverse();
    return buildThreadItems(ascComments);
  }, [visible]);

  // Luôn cuộn xuống tin mới nhất (đáy). List không inverted + data ASC ⇒ đáy = tin mới
  // nhất. onContentSizeChange fire lúc mount, load data, có tin mới, và khi bong bóng gợi
  // ý AI xuất hiện ⇒ vào chat / vào lại luôn ở đáy. Chặn cuộn khi đang tải TRANG CŨ hơn
  // (kéo refresh) để không giật người dùng khỏi vị trí đang đọc.
  const listRef = useRef<FlatList>(null);
  const scrollToBottom = (animated: boolean) => {
    if (isFetchingNextPage) return;
    listRef.current?.scrollToEnd({ animated });
  };

  // Gen gợi ý AI xong (bong bóng xuất hiện ở cuối chat) → cuộn xuống để user thấy ngay.
  // Đảm bảo chắc chắn kể cả khi onContentSizeChange không kịp fire.
  useEffect(() => {
    if (aiSuggestions.length === 0) return;
    const t = setTimeout(() => scrollToBottom(true), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiSuggestions.length]);

  // Housekeeping — đánh dấu đã đọc các comment đang hiển thị trong tab hiện tại, 1 lần/id.
  const markedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!onMarkRead) return;
    const unmarked = visible.map((c) => c.id).filter((id) => !markedRef.current.has(id));
    if (unmarked.length === 0) return;
    unmarked.forEach((id) => markedRef.current.add(id));
    onMarkRead(unmarked);
  }, [visible, onMarkRead]);

  // "now" cập nhật định kỳ — tránh gọi Date.now() trực tiếp mỗi render khi tính edit window.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);


  // Bản dịch giữ cục bộ theo chatId — cho phép toggle gốc/dịch không cần gọi lại BE.
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
              Công khai ({publicCount})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, tab === 'internal' && styles.tabBtnActiveInternal]}
            onPress={() => setTab('internal')}
          >
            <Ionicons name="lock-closed-outline" size={14} color={tab === 'internal' ? Colors.warningDark : Colors.textMute} />
            <Text style={[styles.tabBtnText, tab === 'internal' && styles.tabBtnTextActiveInternal]}>
              Nội bộ ({internalCount})
            </Text>
          </Pressable>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={36} color={Colors.textFaint} />
          <Text style={styles.emptyText}>
            {showTabs ? (tab === 'public' ? 'Chưa có bình luận công khai.' : 'Chưa có bình luận nội bộ.') : emptyText}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.list}
          data={items}
          keyExtractor={(item) => item.key}
          onContentSizeChange={() => scrollToBottom(false)}
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
            const comment = item.comment;
            const isOwn = !!currentUserId && comment.authorUserId === currentUserId;
            const authorWindowOk = isOwn && now - new Date(comment.createdAt).getTime() <= EDIT_WINDOW_MS;
            const canEdit = !ticketClosed && (authorWindowOk || canEditAny) && !!onEdit;
            const canDelete = !ticketClosed && (isOwn || canDeleteAny) && !!onDelete;
            const canPin = !ticketClosed && !!onPin && !!onUnpin;
            const canShowReaders = !!onShowReaders;
            const editNeedsReason = canEdit && !authorWindowOk;
            const deleteNeedsReason = canDelete && !isOwn;
            // Chỉ tin của chính mình mới chọn được — tin người khác BE xử lý bằng
            // "ẩn riêng" chứ không xoá, không đưa vào luồng này.
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
                // Tin người khác: không checkbox, làm mờ để thấy rõ là không chọn được.
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
                  <Text style={styles.aiHeaderText}>Gợi ý trả lời (AI) — bấm để chèn vào ô nhập</Text>
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
                  <Text style={styles.aiDismiss}>Bỏ qua gợi ý</Text>
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
  // FlatList inverted lật trục dọc ⇒ paddingTop của style này hiển thị ở ĐÁY (cạnh
  // composer) và paddingBottom hiển thị ở ĐỈNH (cạnh thanh tab) — set ngược lại trực giác.
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 },
  // Selection mode — checkbox cột trái, bubble giữ nguyên layout gốc bên phải.
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
  // primaryDark thay primary: checkmark trắng trên vàng #FFD500 gần như không đọc được.
  checkboxOn: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  selectBubble: { flex: 1 },
  selectBubbleDim: { opacity: 0.45 },
  loadingMore: { paddingVertical: 14, alignItems: 'center' },

  // Gợi ý AI — cụm bong bóng cuối chat, căn phải (phía người chat) như web.
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
