import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/src/lib/theme';
import { useKbSuggestions } from '../hooks/useKbSuggestions';
import { KbSuggestionDTO } from '../types/suggestion.types';

interface Props {
  ticketId: string;
  /** Bấm vào một tài liệu — điều hướng sang màn chi tiết KB. */
  onOpen?: (kb: KbSuggestionDTO) => void;
  /** Chỉ fetch khi panel thật sự hiển thị (tránh gọi AI cho mọi ticket mở ra xem). */
  enabled?: boolean;
  topN?: number;
}

/**
 * Tài liệu KB do AI đề xuất cho ticket đang xử lý.
 *
 * Chỉ đọc + điều hướng. Việc GẮN tài liệu vào ticket làm trên web (chỉ PrimaryHandler),
 * mobile không đưa nút đó lên để tránh Supporter bấm rồi nhận 403.
 */
export function KbSuggestionPanel({ ticketId, onOpen, enabled = true, topN = 5 }: Props) {
  const { data, isLoading, isError } = useKbSuggestions(ticketId, { topN, enabled });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles-outline" size={16} color={Colors.primaryDark} />
        <Text style={styles.title}>Recommended resources</Text>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primaryDark} />
        </View>
      )}

      {/* Lỗi mạng/quyền (vd Staff chưa được phân công → 403). Khác với trường hợp
          AI không phản hồi, vốn trả 200 kèm aiAvailable=false. */}
      {isError && (
        <Text style={styles.muted}>
          Could not load suggestions. You can still search resources manually.
        </Text>
      )}

      {data && !data.aiAvailable && (
        <View style={styles.notice}>
          <Ionicons name="warning-outline" size={16} color={Colors.warningDark} />
          <Text style={styles.noticeText}>
            {data.note || 'Could not get suggestions from AI. You can still search resources manually.'}
          </Text>
        </View>
      )}

      {data?.aiAvailable && data.items.length === 0 && (
        <Text style={styles.muted}>{data.note || 'No relevant resources found.'}</Text>
      )}

      {data?.items.map((kb) => (
        <Pressable
          key={kb.kbArticleId}
          style={styles.item}
          onPress={() => onOpen?.(kb)}
          disabled={!onOpen}
        >
          <View style={styles.itemHead}>
            <Ionicons name="book-outline" size={14} color={Colors.textMute} />
            <Text style={styles.itemTitle} numberOfLines={2}>
              {kb.title}
            </Text>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{Math.round(kb.score * 100)}%</Text>
            </View>
          </View>
          <Text style={styles.code}>{kb.code}</Text>
          {/* Lý do — cơ sở để kỹ thuật viên tin vào thứ tự xếp hạng. */}
          <Text style={styles.reason}>{kb.reason}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 14, fontWeight: '600', color: Colors.text },
  center: { paddingVertical: Spacing.md, alignItems: 'center' },
  muted: { fontSize: 13, color: Colors.textMute },
  notice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  noticeText: { flex: 1, fontSize: 13, color: Colors.warningDark },
  item: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    gap: 4,
  },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text },
  scoreBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreText: { fontSize: 11, fontWeight: '600', color: Colors.primaryDark },
  code: { fontSize: 11, color: Colors.textMute },
  reason: { fontSize: 12, color: Colors.textMute, lineHeight: 17 },
});
