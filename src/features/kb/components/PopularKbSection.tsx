import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../lib/theme';
import { usePopularKb } from '../hooks/usePopularKb';
import { KbArticleCard } from './KbArticleCard';

interface Props {
  limit?: number;
}

export function PopularKbSection({ limit = 5 }: Props) {
  const { data: popular = [], isLoading } = usePopularKb(limit);

  if (!isLoading && popular.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Bài hướng dẫn phổ biến</Text>
        <Pressable
          onPress={() => router.push('/(customer)/kb' as never)}
          hitSlop={8}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={Colors.primary}
          style={{ marginVertical: 12 }}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {popular.map((article) => (
            <KbArticleCard
              key={article.id}
              article={article}
              variant="dashboard"
              onPress={() =>
                router.push({
                  pathname: '/(customer)/kb/[id]' as never,
                  params: { id: article.id },
                } as never)
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accent,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  row: {
    paddingRight: 12,
    paddingVertical: 2,
  },
});
