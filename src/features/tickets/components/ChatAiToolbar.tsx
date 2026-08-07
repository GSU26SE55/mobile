import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/lib/theme';
import { BottomSheet } from '@/src/shared/components/BottomSheet';
import { ChatAiIntentEnum } from '@/src/features/tickets/enums/chat.enum';
import { useSuggestChat, useSummarizeThread } from '../hooks/useTicketChatActions';

// GH-67 — thanh AI/Export cho Staff, đặt trên ô soạn reply. CHỈ dùng ở màn Staff ticket detail.
// Toolbar disable khi ticket đã đóng (prop disabled = ticketClosed từ [id].tsx).

const INTENTS: { key: ChatAiIntentEnum; label: string }[] = [
  { key: ChatAiIntentEnum.RequestInfo, label: 'Hỏi thêm' },
  { key: ChatAiIntentEnum.TechnicalAnswer, label: 'Kỹ thuật' },
  { key: ChatAiIntentEnum.Resolution, label: 'Giải pháp' },
  { key: ChatAiIntentEnum.FollowUp, label: 'Theo dõi' },
];

interface Props {
  ticketId: string;
  disabled?: boolean;
  /** Kết quả gợi ý → parent render thành bong bóng CUỐI luồng chat (giống web). */
  onSuggestions: (suggestions: string[]) => void;
}

export function ChatAiToolbar({ ticketId, disabled = false, onSuggestions }: Props) {
  const [sheet, setSheet] = useState<'summary' | null>(null);
  // Bấm "Gợi ý" → hiện hàng chip intent (compact). Chọn chip mới gen → đẩy bong bóng vào chat.
  const [intentRowOpen, setIntentRowOpen] = useState(false);
  const [intent, setIntent] = useState<ChatAiIntentEnum | null>(null);
  const [summary, setSummary] = useState('');

  const suggest = useSuggestChat(ticketId);
  const summarize = useSummarizeThread(ticketId);

  const runSuggest = (it: ChatAiIntentEnum) => {
    setIntent(it);
    suggest.mutate(it, {
      onSuccess: (dto) => {
        onSuggestions(dto?.suggestions ?? []);
        setIntentRowOpen(false); // gen xong → thu hàng chip, bong bóng đã hiện trong chat
      },
    });
  };

  const openSuggest = () => {
    setIntent(null);
    setIntentRowOpen((v) => !v); // toggle hàng chip
  };

  const openSummary = () => {
    setSummary('');
    setSheet('summary');
    summarize.mutate(undefined, { onSuccess: (dto) => setSummary(dto?.summary ?? '') });
  };

  return (
    <>
      <View style={styles.bar}>
        <ToolBtn icon="sparkles-outline" label="Gợi ý" loading={suggest.isPending} disabled={disabled} onPress={openSuggest} />
        <ToolBtn icon="document-text-outline" label="Tóm tắt" loading={summarize.isPending} disabled={disabled} onPress={openSummary} />
      </View>

      {/* Gợi ý AI — chỉ hàng chip intent. Chọn 1 loại → gen → bong bóng hiện CUỐI chat. */}
      {intentRowOpen && (
        <View style={styles.intentPanel}>
          <View style={styles.intentRow}>
            {INTENTS.map((it) => (
              <Pressable
                key={it.key}
                style={[styles.chip, intent === it.key && styles.chipActive]}
                onPress={() => runSuggest(it.key)}
                disabled={suggest.isPending}
              >
                <Text style={[styles.chipText, intent === it.key && styles.chipTextActive]}>{it.label}</Text>
              </Pressable>
            ))}
          </View>
          {suggest.isPending && (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.intentLoading} />
          )}
        </View>
      )}

      {/* Tóm tắt */}
      <BottomSheet visible={sheet === 'summary'} onClose={() => setSheet(null)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Tóm tắt hội thoại</Text>
          {summarize.isPending ? (
            <ActivityIndicator color={Colors.primary} style={styles.sheetLoading} />
          ) : (
            <Text style={styles.summaryText}>{summary || 'Không có nội dung.'}</Text>
          )}
        </View>
      </BottomSheet>
    </>
  );
}

function ToolBtn({
  icon, label, loading, disabled, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const off = disabled || loading;
  return (
    <Pressable style={[styles.btn, off && styles.btnOff]} onPress={onPress} disabled={off}>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primaryDark} />
      ) : (
        <Ionicons name={icon} size={16} color={disabled ? Colors.textMute : Colors.text} />
      )}
      <Text style={[styles.btnText, disabled && styles.btnTextOff]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.bg,
  },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 7, borderRadius: 10, backgroundColor: Colors.primaryLight,
  },
  // Trước dùng opacity 0.5 chồng lên chữ vàng #D9A000 trên nền #FFF6D6 (vốn đã
  // yếu ~2.4:1) → nút mờ hẳn, không đọc được. Nay đổi NỀN sang xám thay vì hạ
  // opacity, chữ vẫn đủ đậm để biết nút tên gì dù đang bị khoá.
  btnOff: { backgroundColor: Colors.card2 },
  btnText: { fontSize: 12, fontWeight: '700', color: Colors.text },
  btnTextOff: { color: Colors.textMute },

  sheet: { gap: 12, paddingBottom: 8 },
  sheetTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.text },
  sheetLoading: { paddingVertical: 20 },
  summaryText: { fontSize: 14, color: Colors.text, lineHeight: 22 },

  intentPanel: {
    paddingHorizontal: 12, paddingBottom: 8,
    backgroundColor: Colors.bg,
  },
  intentLoading: { paddingTop: 8 },
  intentRow: { flexDirection: 'row', gap: 6 },
  chip: { flex: 1, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.card2, alignItems: 'center' },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 11, fontWeight: '700', color: Colors.textMute },
  chipTextActive: { color: Colors.text },
});
