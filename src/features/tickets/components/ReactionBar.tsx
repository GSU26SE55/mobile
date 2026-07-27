import { useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadow } from '../../../lib/theme';
import { ReactionTypeEnum, TicketChatReactionsAggregateDTO } from '../types/ticket.types';

// Kích thước picker — nội dung cố định (5 emoji) nên tính sẵn được, dùng để
// clamp trong màn hình và quyết định lật lên/xuống. Sai số nhỏ đã có clamp lo.
const PICKER_W = 238;
const PICKER_H = 54;
const GAP = 6;   // khoảng cách picker ↔ nút "+"
const EDGE = 8;  // chừa mép màn hình

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
  // Vị trí picker tính từ toạ độ thật của nút "+" trong window. Trước đây Modal
  // căn giữa màn hình nên picker luôn nhảy ra giữa, đè lên bubble không liên quan.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const addBtnRef = useRef<View>(null);

  const openPicker = () => {
    addBtnRef.current?.measureInWindow((x, y, w, h) => {
      const { width: screenW, height: screenH } = Dimensions.get('window');

      // Bám mép bubble: tin của mình canh phải, tin người khác canh trái.
      let left = alignEnd ? x + w - PICKER_W : x;
      left = Math.min(Math.max(left, EDGE), screenW - PICKER_W - EDGE);

      // Mặc định nằm DƯỚI nút; sát đáy màn hình thì lật lên trên để không bị cắt.
      let top = y + h + GAP;
      if (top + PICKER_H > screenH - EDGE) top = y - PICKER_H - GAP;
      top = Math.max(top, EDGE);

      setPos({ top, left });
      setPickerOpen(true);
    });
  };

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

      <Pressable ref={addBtnRef} style={styles.addBtn} onPress={openPicker} hitSlop={6}>
        <Text style={styles.addBtnText}>＋</Text>
      </Pressable>

      <Modal
        visible={pickerOpen && !!pos}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <View
            style={[styles.picker, { top: pos?.top ?? 0, left: pos?.left ?? 0 }, Shadow]}
            onStartShouldSetResponder={() => true}
          >
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

  // KHÔNG căn giữa — picker tự định vị absolute theo toạ độ nút "+".
  backdrop: { flex: 1 },
  picker: {
    position: 'absolute',
    flexDirection: 'row', gap: 6,
    backgroundColor: Colors.card, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  pickerItem: { padding: 6, borderRadius: 999 },
  pickerItemMine: { backgroundColor: Colors.primaryLight },
  pickerEmoji: { fontSize: 22 },
});
