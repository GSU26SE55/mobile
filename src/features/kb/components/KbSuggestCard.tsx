import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import type { KbArticleSuggestDTO } from '../types/kb.types';

interface Props {
  article: KbArticleSuggestDTO;
  onPress?: () => void;
  // Right-hand slot — e.g. the "Attach" button in KbReferencePicker. Defaults to a chevron.
  rightSlot?: React.ReactNode;
}

// GH-44 — card for KbArticleSuggestDTO (suggest shape: no category/status, has symptoms).
export function KbSuggestCard({ article, onPress, rightSlot }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name="book-outline" size={18} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.code}>{article.code}</Text>
        <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
        {!!article.symptoms && (
          <Text style={styles.symptoms} numberOfLines={1}>{article.symptoms}</Text>
        )}
        <View style={styles.metaRow}>
          <Ionicons name="thumbs-up-outline" size={11} color={Colors.textFaint} />
          <Text style={styles.metaText}>{article.helpfulCount}</Text>
          <Ionicons name="eye-outline" size={11} color={Colors.textFaint} style={{ marginLeft: 8 }} />
          <Text style={styles.metaText}>{article.viewCount}</Text>
        </View>
      </View>
      {rightSlot ?? <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />}
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
  content: { flex: 1, gap: 3 },
  code: { fontSize: 10, fontWeight: '700', color: Colors.textMute, letterSpacing: 0.2 },
  title: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18 },
  symptoms: { fontSize: 11, color: Colors.textMute },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  metaText: { fontSize: 11, color: Colors.textFaint, fontWeight: '600' },
});
