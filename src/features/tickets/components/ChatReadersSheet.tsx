import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../lib/theme';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { useChatReaders } from '../hooks/useChatReaders';

interface Props {
  ticketId: string;
  /** null = đóng sheet. Khác null thì fetch readers của chat đó. */
  chatId: string | null;
  onClose: () => void;
}

/**
 * "Đã đọc bởi" — danh sách user đã đọc 1 chat.
 * CHỈ dùng ở màn Staff: BE giới hạn Staff/Manager/Admin, Customer gọi sẽ 403.
 */
export function ChatReadersSheet({ ticketId, chatId, onClose }: Props) {
  const { data: readers = [], isLoading } = useChatReaders(ticketId, chatId ?? undefined, !!chatId);

  return (
    <BottomSheet visible={!!chatId} onClose={onClose}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Đã đọc bởi</Text>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loading} />
        ) : readers.length === 0 ? (
          <Text style={styles.empty}>Chưa có ai đọc tin này.</Text>
        ) : (
          readers.map((r) => (
            <View key={`${r.userId}-${r.readAt}`} style={styles.row}>
              <Ionicons name="checkmark-done" size={16} color={Colors.primaryDark} />
              <Text style={styles.role}>{r.role}</Text>
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
  role: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text },
  time: { fontSize: 11, color: Colors.textFaint },
});
