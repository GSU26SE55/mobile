import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateShort } from '@/src/lib/date';
import { Colors } from '@/src/lib/theme';
import { TicketCommentDTO } from '../types/ticket.types';

interface Props {
  chats: TicketCommentDTO[];
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  onPressChat: (ticketId: string) => void;
  emptyText?: string;
}

const ROLE_LABEL: Record<string, string> = {
  System: 'System',
  Customer: 'Customer',
  Manager: 'Manager',
  Staff: 'Staff',
};

// GH-68 — my chat inbox (FLAT, BE doesn't group). Tap → opens the ticket containing the chat.
export function ChatInboxList({
  chats,
  isLoading,
  onRefresh,
  refreshing,
  onPressChat,
  emptyText = 'No messages yet.',
}: Props) {
  return (
    <FlatList
      data={chats}
      keyExtractor={(c) => c.id}
      contentContainerStyle={styles.content}
      onRefresh={onRefresh}
      refreshing={refreshing ?? false}
      ListEmptyComponent={
        !isLoading ? <Text style={styles.empty}>{emptyText}</Text> : null
      }
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => onPressChat(item.ticketId)}>
          <View style={styles.avatar}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.primaryDark} />
          </View>
          <View style={styles.body}>
            <Text style={styles.author} numberOfLines={1}>
              {item.authorDisplayName ?? ROLE_LABEL[item.authorRole] ?? item.authorRole}
            </Text>
            <Text style={styles.snippet} numberOfLines={1}>
              {item.body?.trim() || '(no content)'}
            </Text>
          </View>
          <Text style={styles.time}>
            {formatDateShort(item.createdAt)}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, paddingBottom: 32 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  author: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  snippet: { fontSize: 12.5, color: Colors.textMute },
  time: { fontSize: 11, color: Colors.textFaint },
  empty: { fontSize: 13, color: Colors.textMute, textAlign: 'center', marginTop: 40 },
});
