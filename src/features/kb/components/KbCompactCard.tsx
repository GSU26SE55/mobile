import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import type { KbArticleSummaryDTO } from '../types/kb.types';
import { KbCategoryBadge } from './KbCategoryBadge';

interface Props {
  article: KbArticleSummaryDTO;
  onPress: () => void;
  badge?: 'staff-recommend' | 'auto-suggest';
}

export function KbCompactCard({ article, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name="book-outline" size={18} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.code}>{article.code}</Text>
          <KbCategoryBadge category={article.category} size="sm" />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  code: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMute,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
});
