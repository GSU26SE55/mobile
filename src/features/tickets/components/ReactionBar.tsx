import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadow } from '../../../lib/theme';
import { ReactionTypeEnum, TicketChatReactionsAggregateDTO } from '../types/ticket.types';

// Map ReactionTypeEnum ↔ key trong aggregate ↔ emoji hiển thị.
const REACTIONS: {
  type: ReactionTypeEnum;
  key: keyof TicketChatReactionsAggregateDTO;
  emoji: string;
}[] = [
  { type: ReactionTypeEnum.ThumbsUp, key: 'thumbsUp', emoji: '👍' },
  { type: ReactionTypeEnum.Acknowledged, key: 'acknowledged', emoji: '🫡' },
  { type: ReactionTypeEnum.Resolved, key: 'resolved', emoji: '😀' },
  { type: ReactionTypeEnum.NeedMoreInfo, key: 'needMoreInfo', emoji: '🤔' },
  { type: ReactionTypeEnum.Disagree, key: 'disagree', emoji: '🙄' },
];

interface ReactionBarProps {
  reactions?: TicketChatReactionsAggregateDTO;
  currentUserId: string | null;
  onToggle: (type: ReactionTypeEnum, isActive: boolean) => void;
  alignEnd?: boolean;
}

/** Bar reaction dưới bubble: chip có count > 0 (highlight nếu mình đã react) + nút "+" mở picker. */
export function ReactionBar({ reactions, currentUserId, onToggle, alignEnd }: ReactionBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const isMine = (key: keyof TicketChatReactionsAggregateDTO) =>
    !!currentUserId && !!reactions?.[key]?.users?.some((u) => u.userId === currentUserId);

  const active = REACTIONS.map((r) => ({
    ...r,
    count: reactions?.[r.key]?.count ?? 0,
    mine: isMine(r.key),
  })).filter((r) => r.count > 0);

  return (
    <View style={[styles.row, alignEnd && styles.rowEnd]}>
      {active.map((r) => (
        <Pressable
          key={r.type}
          style={[styles.chip, r.mine && styles.chipMine]}
          onPress={() => onToggle(r.type, r.mine)}
        >
          <Text style={styles.chipEmoji}>{r.emoji}</Text>
          <Text style={[styles.chipCount, r.mine && styles.chipCountMine]}>{r.count}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.addBtn} onPress={() => setPickerOpen(true)} hitSlop={6}>
        <Text style={styles.addBtnText}>＋</Text>
      </Pressable>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <View style={[styles.picker, Shadow]} onStartShouldSetResponder={() => true}>
            {REACTIONS.map((r) => (
              <Pressable
                key={r.type}
                style={[styles.pickerItem, isMine(r.key) && styles.pickerItemMine]}
                onPress={() => {
                  onToggle(r.type, isMine(r.key));
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.pickerEmoji}>{r.emoji}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 2 },
  rowEnd: { justifyContent: 'flex-end' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.card2, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  chipMine: { backgroundColor: Colors.primaryLight },
  chipEmoji: { fontSize: 12 },
  chipCount: { fontSize: 11, fontWeight: '700', color: Colors.textMute },
  chipCountMine: { color: Colors.primaryDark },
  addBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textMute, lineHeight: 15 },

  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  picker: {
    flexDirection: 'row', gap: 6,
    backgroundColor: Colors.card, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  pickerItem: { padding: 6, borderRadius: 999 },
  pickerItemMine: { backgroundColor: Colors.primaryLight },
  pickerEmoji: { fontSize: 22 },
});
