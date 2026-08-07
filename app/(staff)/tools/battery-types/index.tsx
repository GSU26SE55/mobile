import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '@/src/lib/theme';
import { useBatteryTypes } from '@/src/features/battery-types/hooks/useBatteryTypes';
import { BatteryTypeCard } from '@/src/features/battery-types/components/BatteryTypeCard';
import { BackButton } from '@/src/shared/components/ScreenHeader';
import { SearchBar } from '@/src/shared/components/SearchBar';
import { useDebouncedValue } from '@/src/shared/hooks/useDebouncedValue';

// GH-56 — danh sách loại pin (read-only). Search keyword + phân trang đơn giản (1 trang lớn).
export default function BatteryTypesListScreen() {
  const insets = useSafeAreaInsets();
  const [keyword, setKeyword] = useState('');
  const debounced = useDebouncedValue(keyword, 300);
  const { data, isLoading, isError, refetch, isFetching } = useBatteryTypes({
    pageNumber: 1,
    pageSize: 50,
    keyword: debounced || undefined,
  });
  const items = data?.items ?? [];

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <Text style={styles.topTitle}>Loại pin</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Tìm theo tên hoặc nhà sản xuất"
        />
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
  headerSpacer: { width: 44 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  // Chỉ lo khoảng cách — kiểu dáng ô search nằm trong <SearchBar> dùng chung.
  searchWrap: { marginHorizontal: 16, marginBottom: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMute },
  retryBtn: { backgroundColor: Colors.card, borderRadius: Radius.sm, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
