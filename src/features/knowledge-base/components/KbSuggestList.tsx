import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../lib/theme';

// Shape tối thiểu dùng chung cho cả suggest (KbArticleSuggestDto) và list item (KbArticleListItemDto).
export interface KbSuggestItem {
  id: string;
  code: string;
  title: string;
}

interface Props {
  title?: string;
  items: KbSuggestItem[];
  onPressItem: (id: string) => void;
}

export function KbSuggestList({ title = 'Bài viết liên quan', items, onPressItem }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Ionicons name="book-outline" size={15} color={Colors.primaryDark} />
        <Text style={styles.headerText}>{title}</Text>
      </View>
      {items.map((item) => (
        <Pressable key={item.id} style={styles.row} onPress={() => onPressItem(item.id)}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.rowCode}>{item.code}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={Colors.textFaint} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  headerText: { fontSize: 13, fontWeight: '800', color: Colors.primaryDark },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, lineHeight: 18 },
  rowCode: { fontSize: 10, fontWeight: '700', color: Colors.textMute, letterSpacing: 0.2 },
});
