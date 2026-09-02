import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/src/shared/components/BottomSheet";
import { Colors } from "@/src/lib/theme";
import { formatDateTime } from "@/src/lib/date";
import { TicketCommentDTO } from "../types/ticket.types";

interface Props {
  visible: boolean;
  onClose: () => void;
  pinned: TicketCommentDTO[];
  authorName: (comment: TicketCommentDTO) => string;
  /** Scrolls the thread to this message and closes the sheet. */
  onJumpTo: (comment: TicketCommentDTO) => void;
  /** Omitted when the viewer lacks chat.pin — the list stays readable, just not editable. */
  onUnpin?: (comment: TicketCommentDTO) => void;
}

/**
 * The full list of a ticket's pinned messages.
 *
 * The bar above the thread only has room for the most recent one, but the BE allows up to
 * five — so without this the rest are pinned yet invisible.
 *
 * A bottom sheet rather than a centred dialog: that is what every other modal in this app uses,
 * and it keeps the list reachable with one thumb.
 */
export function PinnedMessagesSheet({
  visible,
  onClose,
  pinned,
  authorName,
  onJumpTo,
  onUnpin,
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Pinned messages</Text>
        <Pressable hitSlop={8} onPress={onClose} accessibilityLabel="Close">
          <Ionicons name="close" size={20} color={Colors.textFaint} />
        </Pressable>
      </View>

      {pinned.length === 0 ? (
        <Text style={styles.empty}>No pinned messages.</Text>
      ) : (
        pinned.map((c) => (
          <View key={c.id} style={styles.row}>
            {/* Tapping the body jumps to the message; unpin is its own control so a mis-tap
                cannot silently remove someone else's pin. */}
            <Pressable
              style={styles.rowBody}
              onPress={() => onJumpTo(c)}
              accessibilityRole="button"
              accessibilityLabel={`View the message from ${authorName(c)} in the conversation`}
            >
              <View style={styles.metaRow}>
                <Text style={styles.author} numberOfLines={1}>
                  {authorName(c)}
                </Text>
                <Text style={styles.time}>{formatDateTime(c.createdAt)}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={3}>
                {c.body}
              </Text>
            </Pressable>

            {onUnpin && (
              <Pressable
                hitSlop={8}
                style={styles.unpinBtn}
                onPress={() => onUnpin(c)}
                accessibilityRole="button"
                accessibilityLabel={`Unpin the message from ${authorName(c)}`}
              >
                <Ionicons
                  name="bookmark"
                  size={16}
                  color={Colors.primaryDark}
                />
              </Pressable>
            )}
          </View>
        ))
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: "700", color: Colors.text },
  empty: {
    fontSize: 13,
    color: Colors.textFaint,
    textAlign: "center",
    paddingVertical: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowBody: { flex: 1, minWidth: 0 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  author: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
    flexShrink: 1,
  },
  time: { fontSize: 10, color: Colors.textFaint },
  preview: { fontSize: 13, color: Colors.text, marginTop: 2 },
  unpinBtn: { padding: 4 },
});

export default PinnedMessagesSheet;
