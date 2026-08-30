import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/lib/theme';
import { TicketCommentDTO } from '../types/ticket.types';

interface Props {
  /** Newest first — the bar shows [0] and offers the rest through the dialog. */
  pinned: TicketCommentDTO[];
  authorName: (comment: TicketCommentDTO) => string;
  /** Opens the full "Pinned messages" list. */
  onOpenList: () => void;
}

/**
 * The strip above the thread showing the most recently pinned message.
 *
 * Sits OUTSIDE the FlatList (between the tab bar and the list), so it stays put while the
 * conversation scrolls under it — the same effect `position: sticky` gives on web, without
 * needing a sticky header inside the list.
 *
 * Only the newest is shown: the bar has one line to spend, and the BE allows up to five, so a
 * stack of them would push the conversation itself off screen. The "+N" count is what tells
 * the reader there are more; tapping anywhere opens the full list.
 */
export function PinnedMessageBar({ pinned, authorName, onOpenList }: Props) {
  if (pinned.length === 0) return null;
  const latest = pinned[0];

  return (
    <Pressable
      style={styles.bar}
      onPress={onOpenList}
      accessibilityRole="button"
      accessibilityLabel={`${pinned.length} pinned ${pinned.length === 1 ? 'message' : 'messages'}. Open the list.`}
    >
      <Ionicons name="bookmark" size={14} color={Colors.primaryDark} />
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.author} numberOfLines={1}>
            {authorName(latest)}
          </Text>
          {pinned.length > 1 && (
            <Text style={styles.more}>+{pinned.length - 1} more</Text>
          )}
        </View>
        {/* One line only: the bar points AT the message, it is not a copy of it. */}
        <Text style={styles.preview} numberOfLines={1}>
          {latest.body}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={Colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.card2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  body: { flex: 1, minWidth: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  author: { fontSize: 11, fontWeight: '700', color: Colors.primaryDark, flexShrink: 1 },
  more: { fontSize: 10, color: Colors.textFaint },
  preview: { fontSize: 12, color: Colors.text, marginTop: 1 },
});

export default PinnedMessageBar;
