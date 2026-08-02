import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/src/lib/theme';
import { useMyChats } from '@/src/features/tickets/hooks/useChatInbox';
import { ChatInboxList } from '@/src/features/tickets/components/ChatInboxList';

// GH-68 — inbox chat của tôi (FLAT, BE không group). Tap → mở ticket chứa chat.
export default function ChatInboxScreen() {
  const { data: chats = [], isLoading, refetch, isRefetching } = useMyChats();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ChatInboxList
      chats={chats}
      isLoading={isLoading}
      onRefresh={refetch}
      refreshing={isRefetching}
      onPressChat={(ticketId) => router.push(`/(customer)/tickets/${ticketId}`)}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
});
