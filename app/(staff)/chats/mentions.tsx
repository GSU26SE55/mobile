import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../../src/lib/theme';
import { ScreenHeader } from '../../../src/shared/components/ScreenHeader';
import { useMyMentions } from '../../../src/features/tickets/hooks/useChatInbox';

// GH-68 — @mention tới Staff. GH-866: BE bỏ endpoint acknowledge; chấm vàng = chat nội bộ.
export default function StaffMentionsScreen() {
  const { data: mentions = [], isLoading, refetch, isRefetching } = useMyMentions();

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
              <View style={[styles.dot, item.isInternal && styles.dotInternal]} />
              <View style={styles.body}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.mentionedDisplayName ?? 'Bạn được nhắc đến'}
                  </Text>
                  {/* Nhãn chữ đi kèm chấm vàng — chỉ chấm màu thì không ai đoán ra nghĩa. */}
                  {item.isInternal && <Text style={styles.internalTag}>Nội bộ</Text>}
                </View>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleString('vi-VN', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
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
  dotInternal: { backgroundColor: Colors.warning },
  body: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  internalTag: {
    fontSize: 10, fontWeight: '700', color: Colors.warning,
    borderWidth: 1, borderColor: Colors.warning, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  name: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  time: { fontSize: 11, color: Colors.textFaint },
  empty: { fontSize: 13, color: Colors.textMute, textAlign: 'center', marginTop: 40 },
});
