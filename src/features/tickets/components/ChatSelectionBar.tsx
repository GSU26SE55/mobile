import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../lib/theme';
import { CHAT_BULK_DELETE_MAX } from '../types/chat-actions.types';

interface HeaderProps {
  count: number;
  onCancel: () => void;
}

/** Header khi đang chọn nhiều tin — thay thanh tiêu đề thường của màn hình chat. */
export function ChatSelectionHeader({ count, onCancel }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onCancel} hitSlop={8}>
        <Text style={styles.cancel}>Hủy</Text>
      </Pressable>
      <Text style={styles.title}>
        {count > 0 ? `Đã chọn ${count}` : 'Chọn tin nhắn'}
      </Text>
      {/* Giữ chỗ cân đối với nút Hủy để title nằm chính giữa. */}
      <View style={styles.spacer} />
    </View>
  );
}

interface FooterProps {
  count: number;
  pending: boolean;
  onDelete: () => void;
}

/** Nút xoá cố định đáy màn hình — disable khi chưa chọn gì hoặc vượt giới hạn BE. */
export function ChatSelectionFooter({ count, pending, onDelete }: FooterProps) {
  const overLimit = count > CHAT_BULK_DELETE_MAX;
  const disabled = count === 0 || pending || overLimit;

  return (
    <View style={styles.footer}>
      {overLimit && (
        <Text style={styles.limitWarn}>
          Chỉ xoá được tối đa {CHAT_BULK_DELETE_MAX} tin mỗi lần.
        </Text>
      )}
      <Pressable
        style={[styles.deleteBtn, disabled && styles.deleteBtnOff]}
        onPress={onDelete}
        disabled={disabled}
      >
        {pending ? (
          <ActivityIndicator size="small" color={Colors.danger} />
        ) : (
          <Text style={[styles.deleteText, disabled && styles.deleteTextOff]}>
            {count > 0 ? `Xóa (${count})` : 'Xóa'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  // primary là vàng #FFD500 — trên nền card trắng phải dùng primaryDark mới đọc được.
  cancel: { fontSize: 16, color: Colors.primaryDark },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  spacer: { width: 36 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
    gap: 6,
  },
  limitWarn: { fontSize: 12, color: Colors.danger, textAlign: 'center' },
  deleteBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  deleteBtnOff: { opacity: 0.4 },
  deleteText: { fontSize: 16, fontWeight: '600', color: Colors.danger },
  deleteTextOff: { color: Colors.textMute },
});
