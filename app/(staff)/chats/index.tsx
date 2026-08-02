import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/src/lib/theme';
import { ScreenHeader } from '@/src/shared/components/ScreenHeader';
import { useMyChats } from '@/src/features/tickets/hooks/useChatInbox';
import { ChatInboxList } from '@/src/features/tickets/components/ChatInboxList';

// GH-68 — inbox chat của Staff. Tap → mở ticket (staff route).
export default function StaffChatInboxScreen() {
  const { data: chats = [], isLoading, refetch, isRefetching } = useMyChats();

  return (
    <View style={styles.root}>
      <ScreenHeader title="Hộp thư chat" />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ChatInboxList
          chats={chats}
          isLoading={isLoading}
          onRefresh={refetch}
          refreshing={isRefetching}
          onPressChat={(ticketId) => router.push(`/(staff)/tickets/${ticketId}`)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
