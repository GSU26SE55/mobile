import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import type { TicketCategoryEnum } from '@/src/shared/enums/ticket.enum';
import { KbCategoryLabel } from '@/src/shared/enums/kb.enum';

interface Props {
  query?: string;
  category?: TicketCategoryEnum | null;
}

export function KbEmptyState({ query, category }: Props) {
  let title = 'Chưa có bài viết nào';
  let subtitle = 'Quay lại sau khi có nội dung mới được xuất bản.';

  if (query && query.trim().length > 0) {
    title = `Không tìm thấy bài viết khớp với "${query.trim()}"`;
    subtitle = 'Thử bỏ bộ lọc hoặc đổi từ khóa khác.';
  } else if (category) {
    title = `Chưa có bài viết trong danh mục "${KbCategoryLabel[category]}"`;
    subtitle = 'Hãy chọn danh mục khác hoặc xem tất cả.';
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="book-outline" size={32} color={Colors.textFaint} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMute,
    textAlign: 'center',
    lineHeight: 18,
  },
});
