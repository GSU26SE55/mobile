import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../lib/theme';
import type { TicketDetailDTO } from '../../tickets/types/ticket.types';
import { useRelatedKb } from '../hooks/useRelatedKb';
import { KbCompactCard } from './KbCompactCard';

interface Props {
  ticket: TicketDetailDTO;
}

export function KbRelatedSection({ ticket }: Props) {
  const relatedIds = useMemo(() => {
    const ids = (ticket.maintenanceLogs ?? []).flatMap(
      (log) => log.relatedKbArticleIds ?? [],
    );
    return Array.from(new Set(ids)).filter(Boolean);
  }, [ticket.maintenanceLogs]);

  const { data, isLoading, source } = useRelatedKb({
    relatedIds,
    fallbackCategory: ticket.category ?? null,
    fallbackLimit: 3,
  });

  if (!isLoading && data.length === 0) {
    return null;
  }

  const subtitle =
    source === 'primary'
      ? 'Kỹ thuật viên đề xuất'
      : source === 'fallback'
      ? 'Gợi ý theo loại lỗi'
      : '';

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Bài hướng dẫn liên quan</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
            <KbCompactCard
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
