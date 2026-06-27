import { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../lib/theme';
import { ChatBubble } from './ChatBubble';
import { TicketCommentDTO } from '../types/ticket.types';

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
}: CommentThreadProps) {
  const items = useMemo(() => {
    const ascComments = [...comments].reverse();
    return buildThreadItems(ascComments);
  }, [comments]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="chatbubbles-outline" size={36} color={Colors.textFaint} />
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) =>
        item.kind === 'date' ? (
          <View style={styles.dateRow}>
            <View style={styles.dateLine} />
            <Text style={styles.dateLabel}>{item.label}</Text>
            <View style={styles.dateLine} />
          </View>
        ) : (
          <ChatBubble
            comment={item.comment}
            isMe={!!currentUserId && item.comment.authorUserId === currentUserId}
            imageHeaders={imageHeaders}
            onImagePress={onImagePress}
            accentColor={accentColor}
          />
        )
      }
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
      refreshing={isFetchingNextPage}
      onRefresh={() => {
        if (hasNextPage && !isFetchingNextPage) onLoadMore?.();
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  emptyText: { color: Colors.textFaint, fontSize: 14, fontWeight: '500' },
  list: { flex: 1 },
  // FlatList inverted lật trục dọc ⇒ paddingTop của style này hiển thị ở ĐÁY (cạnh
  // composer) và paddingBottom hiển thị ở ĐỈNH (cạnh thanh tab) — set ngược lại trực giác.
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 },
  loadingMore: { paddingVertical: 14, alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dateLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMute },
});
