import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/lib/theme';
import { ScreenHeader } from '../../../src/shared/components/ScreenHeader';
import { useMyMentions, useAcknowledgeMention } from '../../../src/features/tickets/hooks/useChatInbox';

// GH-68 — @mention tới Staff. Nút "Đã đọc" → acknowledge.
export default function StaffMentionsScreen() {
  const { data: mentions = [], isLoading, refetch, isRefetching } = useMyMentions();
  const { mutate: acknowledge } = useAcknowledgeMention();

  return (
    <View style={styles.root}>
      <ScreenHeader title="Nhắc đến tôi" />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
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
              onPress={() => item.ticketId && router.push(`/(staff)/tickets/${item.ticketId}`)}
            >
              <View style={[styles.dot, item.isAcknowledged && styles.dotRead]} />
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
              {!item.isAcknowledged && (
                <Pressable style={styles.ackBtn} hitSlop={8} onPress={() => acknowledge(item.id)}>
                  <Ionicons name="checkmark-done" size={16} color={Colors.primaryDark} />
                  <Text style={styles.ackText}>Đã đọc</Text>
                </Pressable>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 12, paddingBottom: 32 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  dotRead: { backgroundColor: Colors.border },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  time: { fontSize: 11, color: Colors.textFaint },
  ackBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ackText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  empty: { fontSize: 13, color: Colors.textMute, textAlign: 'center', marginTop: 40 },
});
