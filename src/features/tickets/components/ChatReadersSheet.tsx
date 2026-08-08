import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/lib/theme';
import { BottomSheet } from '@/src/shared/components/BottomSheet';
import { useChatReaders } from '../hooks/useChatReaders';
import type { ActorRoleEnum } from '@/src/shared/enums/ticket.enum';

const ROLE_LABEL: Record<ActorRoleEnum, string> = {
  Admin: 'Admin',
  Manager: 'Manager',
  Staff: 'Technician',
  Customer: 'Customer',
  System: 'System',
};

interface Props {
  ticketId: string;
  /** null = sheet closed. Non-null triggers a fetch of that chat's readers. */
  chatId: string | null;
  onClose: () => void;
}

/**
 * "Read by" — list of users who have read a chat.
 * ONLY used on the Staff screen: BE restricts this to Staff/Manager/Admin, Customer gets a 403.
 */
export function ChatReadersSheet({ ticketId, chatId, onClose }: Props) {
  const { data: readers = [], isLoading } = useChatReaders(ticketId, chatId ?? undefined, !!chatId);

  return (
    <BottomSheet visible={!!chatId} onClose={onClose}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Read by</Text>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loading} />
        ) : readers.length === 0 ? (
          <Text style={styles.empty}>No one has read this message yet.</Text>
        ) : (
          readers.map((r) => (
            <View key={`${r.userId}-${r.readAt}`} style={styles.row}>
              <Ionicons name="checkmark-done" size={16} color={Colors.primaryDark} />
              <View style={styles.who}>
                <Text style={styles.name} numberOfLines={1}>{r.displayName}</Text>
                <Text style={styles.role}>{ROLE_LABEL[r.role] ?? r.role}</Text>
              </View>
              <Text style={styles.time}>
                {new Date(r.readAt).toLocaleString('vi-VN', {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          ))
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: 10, paddingBottom: 8 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.text },
  loading: { paddingVertical: 20 },
  empty: { fontSize: 13, color: Colors.textMute, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  who: { flex: 1, gap: 1 },
  name: { fontSize: 13, fontWeight: '700', color: Colors.text },
  role: { fontSize: 11, color: Colors.textMute },
  time: { fontSize: 11, color: Colors.textFaint },
});
