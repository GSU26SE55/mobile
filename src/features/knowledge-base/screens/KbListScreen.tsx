import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TicketCategoryEnum } from '../../../shared/enums/ticket.enum';
import { Colors } from '../../../lib/theme';
import { KbArticleCard } from '../components/KbArticleCard';
import { useKbArticles } from '../hooks/useKbArticles';
import { CATEGORY_TO_INT } from '../types/knowledge-base.types';

const CATEGORY_CHIPS: { value: TicketCategoryEnum; label: string }[] = [
  { value: 'Charging', label: 'Sạc pin' },
  { value: 'Overheat', label: 'Quá nhiệt' },
  { value: 'NoPower', label: 'Mất điện' },
  { value: 'Performance', label: 'Hiệu suất' },
  { value: 'Repair', label: 'Sửa chữa' },
  { value: 'Other', label: 'Khác' },
];

interface Props {
  role: 'customer' | 'staff';
}

export function KbListScreen({ role }: Props) {
  const insets = useSafeAreaInsets();
  const [keyword, setKeyword] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [category, setCategory] = useState<TicketCategoryEnum | null>(null);

  // Debounce ô tìm kiếm ~400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(keyword.trim()), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const { data, isLoading, isError, isRefetching, refetch } = useKbArticles({
    Q: debouncedQ || undefined,
    Category: category ? CATEGORY_TO_INT[category] : undefined,
    PageSize: 50,
  });

  const articles = data?.items ?? [];

  const goDetail = (id: string) => {
    if (role === 'customer') router.push({ pathname: '/(customer)/wiki/[id]', params: { id } });
    else router.push({ pathname: '/(staff)/wiki/[id]', params: { id } });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Wiki hỗ trợ</Text>
        <Text style={styles.headerSub}>Tra cứu cách tự khắc phục sự cố</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textMute} />
          <TextInput
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Tìm bài viết..."
            placeholderTextColor={Colors.textFaint}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <Pressable onPress={() => setKeyword('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={Colors.textFaint} />
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Pressable
            style={[styles.chip, category === null && styles.chipActive]}
            onPress={() => setCategory(null)}
          >
            <Text style={[styles.chipText, category === null && styles.chipTextActive]}>Tất cả</Text>
          </Pressable>
          {CATEGORY_CHIPS.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategory(active ? null : c.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.textFaint} />
          <Text style={styles.emptyText}>Không thể tải bài viết.</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <KbArticleCard article={item} onPress={() => goDetail(item.id)} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={32} color={Colors.textFaint} />
              <Text style={styles.emptyText}>Không tìm thấy bài viết nào.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    gap: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: Colors.textMute, fontWeight: '500', marginTop: -4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card2,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.card2,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textMute },
  chipTextActive: { color: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { color: Colors.textMute, fontSize: 14, fontWeight: '500' },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  retryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  listContent: { padding: 20, paddingBottom: 120 },
});
