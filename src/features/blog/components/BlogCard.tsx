import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadow } from '@/src/lib/theme';
import { BlogOriginLabel, BlogPostOriginEnum } from '../enums/blog.enum';
import type { BlogPostSummaryDTO } from '../types/blog.types';

interface Props {
  post: BlogPostSummaryDTO;
  onPress: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export const BlogCard = React.memo(function BlogCard({ post, onPress }: Props) {
  const isAi = post.origin === BlogPostOriginEnum.AiGeneratedFromKb;

  return (
    <Pressable style={[styles.card, Shadow]} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={[styles.badge, isAi && styles.badgeAi]}>
          <Ionicons
            name={isAi ? 'sparkles-outline' : 'create-outline'}
            size={11}
            color={isAi ? Colors.primaryDark : Colors.textMute}
          />
          <Text style={[styles.badgeText, isAi && styles.badgeTextAi]}>
            {BlogOriginLabel[post.origin]}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={3}>
        {post.title}
      </Text>

      {post.summary.length > 0 && (
        <Text style={styles.summary} numberOfLines={2}>
          {post.summary}
        </Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.card2,
  },
  badgeAi: {
    backgroundColor: Colors.primaryLight,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMute,
    letterSpacing: 0.2,
  },
  badgeTextAi: {
    color: Colors.primaryDark,
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMute,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 21,
  },
  summary: {
    fontSize: 13,
    color: Colors.textMute,
    lineHeight: 19,
  },
});
