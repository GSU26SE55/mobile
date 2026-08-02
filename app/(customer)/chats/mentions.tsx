import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/src/lib/theme';
import { useMyMentions } from '@/src/features/tickets/hooks/useChatInbox';

// GH-68 — @mention tới tôi (mọi ticket). GH-866: BE bỏ endpoint acknowledge.
// Không hiện chỉ báo isInternal: BE đã lọc mention nội bộ khỏi Customer nên luôn false.
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
      ListEmptyComponent={<Text style={styles.empty}>Chưa có ai nhắc đến bạn.</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => item.ticketId && router.push(`/(customer)/tickets/${item.ticketId}`)}
        >
          <View style={styles.dot} />
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {item.mentionedDisplayName ?? 'Bạn được nhắc đến'}
            </Text>
            <Text style={styles.time}>
              {new Date(item.createdAt).toLocaleString('vi-VN', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
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

