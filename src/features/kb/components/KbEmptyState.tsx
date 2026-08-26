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
  let title = 'No articles yet';
  let subtitle = 'Check back later once new content is published.';

  if (query && query.trim().length > 0) {
    title = `No articles found matching "${query.trim()}"`;
    subtitle = 'Try clearing the filter or using a different keyword.';
  } else if (category) {
    title = `No articles in the "${KbCategoryLabel[category]}" category yet`;
    subtitle = 'Try selecting a different category or view all.';
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
