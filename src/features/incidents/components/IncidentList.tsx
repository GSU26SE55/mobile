import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/lib/theme';
import { EnvironmentalIncidentDto } from '../types/incident.types';
import { IncidentCard } from './IncidentCard';

// Incident list reused for Customer + Staff. Data + onPressItem passed in from the parent.
// siteNameMap optional — maps siteId→siteName so the card can display the site name (DTO has no siteName).
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
            {isLoading ? 'Loading…' : 'No incidents yet'}
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
