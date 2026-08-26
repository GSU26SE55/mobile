import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { CHAT_BULK_DELETE_MAX } from '../types/chat-actions.types';

interface HeaderProps {
  count: number;
  onCancel: () => void;
}

/** Header shown while selecting multiple messages — replaces the chat screen's normal title bar. */
export function ChatSelectionHeader({ count, onCancel }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onCancel} hitSlop={8}>
        <Text style={styles.cancel}>Cancel</Text>
      </Pressable>
      <Text style={styles.title}>
        {count > 0 ? `${count} selected` : 'Select messages'}
      </Text>
      {/* Placeholder to balance the Cancel button so the title stays centered. */}
      <View style={styles.spacer} />
    </View>
  );
}

interface FooterProps {
  count: number;
  pending: boolean;
  onDelete: () => void;
}

/** Delete button pinned to the bottom of the screen — disabled when nothing is selected or the BE limit is exceeded. */
export function ChatSelectionFooter({ count, pending, onDelete }: FooterProps) {
  const overLimit = count > CHAT_BULK_DELETE_MAX;
  const disabled = count === 0 || pending || overLimit;

  return (
    <View style={styles.footer}>
      {overLimit && (
        <Text style={styles.limitWarn}>
          You can only delete up to {CHAT_BULK_DELETE_MAX} messages at a time.
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
            {count > 0 ? `Delete (${count})` : 'Delete'}
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
  // primary is yellow #FFD500 — on a white card background, primaryDark is needed for legibility.
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
