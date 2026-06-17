import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadow } from '../../../lib/theme';
import { KbArticleListItemDto } from '../types/knowledge-base.types';

const CATEGORY_LABEL: Record<string, string> = {
  Charging: 'Sạc pin',
  Overheat: 'Quá nhiệt',
  NoPower: 'Mất điện',
  Performance: 'Hiệu suất',
  Repair: 'Sửa chữa',
  Other: 'Khác',
};

interface Props {
  article: KbArticleListItemDto;
  onPress: () => void;
}

export function KbArticleCard({ article, onPress }: Props) {
  return (
    <Pressable style={[styles.card, Shadow]} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.code}>{article.code}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{CATEGORY_LABEL[article.category] ?? article.category}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{article.title}</Text>

      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <Ionicons name="eye-outline" size={13} color={Colors.textMute} />
          <Text style={styles.metaText}>{article.viewCount}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="thumbs-up-outline" size={13} color={Colors.textMute} />
          <Text style={styles.metaText}>{article.helpfulCount}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Ionicons name="chevron-forward" size={14} color={Colors.textFaint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { fontSize: 11, fontWeight: '800', color: Colors.textMute, letterSpacing: 0.2 },
  categoryBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryText: { fontSize: 10, fontWeight: '700', color: Colors.primaryDark },
  title: { fontSize: 14, fontWeight: '800', color: Colors.text, lineHeight: 20 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.textMute, fontWeight: '600' },
});
