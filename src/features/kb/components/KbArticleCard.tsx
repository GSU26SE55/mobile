import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadow } from '@/src/lib/theme';
import type { KbArticleSummaryDTO } from '../types/kb.types';
import { KbCategoryBadge } from './KbCategoryBadge';

interface Props {
  article: KbArticleSummaryDTO;
  onPress: () => void;
  variant?: 'full' | 'dashboard';
}

export const KbArticleCard = React.memo(function KbArticleCard({
  article,
  onPress,
  variant = 'full',
}: Props) {
  const isDashboard = variant === 'dashboard';
  return (
    <Pressable style={[styles.card, Shadow, isDashboard && styles.cardDashboard]} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.code}>{article.code}</Text>
        <KbCategoryBadge category={article.category} size="sm" />
      </View>

      <Text style={styles.title} numberOfLines={isDashboard ? 2 : 3}>
        {article.title}
      </Text>

      {!isDashboard && (
        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={13} color={Colors.textMute} />
            <Text style={styles.metaText}>{article.viewCount}</Text>
          </View>
          {article.helpfulCount > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="thumbs-up-outline" size={13} color={Colors.textMute} />
              <Text style={styles.metaText}>{article.helpfulCount}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardDashboard: {
    padding: 14,
    marginBottom: 0,
    marginRight: 12,
    width: 240,
    borderRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  code: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMute,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMute,
    fontWeight: '600',
  },
});
