import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../../src/lib/theme';
import { useBatteryTypes } from '../../../../src/features/battery-types/hooks/useBatteryTypes';
import { BatteryTypeCard } from '../../../../src/features/battery-types/components/BatteryTypeCard';

// GH-56 — danh sách loại pin (read-only). Search keyword + phân trang đơn giản (1 trang lớn).
export default function BatteryTypesListScreen() {
  const insets = useSafeAreaInsets();
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword), 400);
    return () => clearTimeout(t);
  }, [keyword]);
  const { data, isLoading, isError, refetch, isFetching } = useBatteryTypes({
    pageNumber: 1,
    pageSize: 50,
    keyword: debounced || undefined,
  });
  const items = data?.items ?? [];

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Loại pin</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textMute} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên hoặc nhà sản xuất"
          placeholderTextColor={Colors.textMute}
          value={keyword}
          onChangeText={setKeyword}
          autoCapitalize="none"
        />
        {keyword.length > 0 && (
          <Pressable hitSlop={8} onPress={() => setKeyword('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMute} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.textMute} />
          <Text style={styles.emptyText}>Không tải được danh sách.</Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, Shadow]}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="battery-dead-outline" size={32} color={Colors.textMute} />
          <Text style={styles.emptyText}>Không có loại pin phù hợp.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <BatteryTypeCard
              item={item}
              onPress={() => router.push(`/(staff)/tools/battery-types/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, height: 44, gap: 8, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMute },
  retryBtn: { backgroundColor: Colors.card, borderRadius: Radius.sm, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
