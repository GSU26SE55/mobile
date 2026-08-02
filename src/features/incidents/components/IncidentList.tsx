import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/lib/theme';
import { EnvironmentalIncidentDto } from '../types/incident.types';
import { IncidentCard } from './IncidentCard';

// List incident tái dùng cho Customer + Staff. Data + onPressItem truyền từ ngoài.
// siteNameMap optional — map siteId→siteName để card hiển thị tên site (DTO không có siteName).
export function IncidentList({
  data,
  isLoading,
  onPressItem,
  siteNameMap,
}: {
  data: EnvironmentalIncidentDto[];
  isLoading: boolean;
  onPressItem: (id: string) => void;
  siteNameMap?: Record<string, string>;
}) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <IncidentCard
          incident={item}
          siteName={siteNameMap?.[item.siteId]}
          onPress={() => onPressItem(item.id)}
        />
      )}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons
            name={isLoading ? 'hourglass-outline' : 'shield-checkmark-outline'}
            size={48}
            color={Colors.textFaint}
          />
          <Text style={styles.emptyText}>
            {isLoading ? 'Đang tải…' : 'Chưa có sự cố nào'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 110 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.textMute },
});
