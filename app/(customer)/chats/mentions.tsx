import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { formatDateTime } from '@/src/lib/date';
import { Colors } from '@/src/lib/theme';
import { useMyMentions } from '@/src/features/tickets/hooks/useChatInbox';

// GH-68 — @mentions of me (all tickets). GH-866: BE removed the acknowledge endpoint.
// No isInternal indicator shown: BE already filters internal mentions out for Customer, so it's always false.
export default function MentionsScreen() {
  const { data: mentions = [], isLoading, refetch, isRefetching } = useMyMentions();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={mentions}
      keyExtractor={(m) => m.id}
      contentContainerStyle={styles.content}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListEmptyComponent={<Text style={styles.empty}>No one has mentioned you yet.</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => item.ticketId && router.push(`/(customer)/tickets/${item.ticketId}`)}
        >
          <View style={styles.dot} />
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {item.mentionedDisplayName ?? 'You were mentioned'}
            </Text>
            <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  content: { padding: 12, paddingBottom: 32 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  time: { fontSize: 11, color: Colors.textFaint },
  empty: { fontSize: 13, color: Colors.textMute, textAlign: 'center', marginTop: 40 },
});

