import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../lib/theme';
import type { TicketDetailDTO } from '../../tickets/types/ticket.types';
import { useKbSuggest } from '../hooks/useKbSuggest';
import { KbSuggestCard } from './KbSuggestCard';

interface Props {
  ticket: TicketDetailDTO;
}

// GH-44 #7 — gợi ý KB server-driven (GET /suggest), thay useRelatedKb client-side cũ.
export function KbRelatedSection({ ticket }: Props) {
  const { data = [], isLoading } = useKbSuggest(ticket.id);

  if (!isLoading && data.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Bài hướng dẫn liên quan</Text>
        <Text style={styles.subtitle}>Gợi ý theo ticket</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={Colors.primary}
          style={{ marginVertical: 12 }}
        />
      ) : (
        <View style={styles.list}>
          {data.map((article) => (
            <KbSuggestCard
              key={article.id}
              article={article}
              onPress={() =>
                router.push({
                  pathname: '/(customer)/kb/[id]' as never,
                  params: { id: article.id },
                } as never)
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  header: {
    marginBottom: 12,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMute,
    fontWeight: '500',
  },
  list: {
    gap: 4,
  },
});
