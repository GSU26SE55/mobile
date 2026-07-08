import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../lib/theme';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { ChatAiIntentEnum } from '../../../shared/enums/chat.enum';
import {
  useExportChatPdf,
  useSentimentCheck,
  useSuggestChat,
  useSummarizeThread,
} from '../hooks/useTicketChatActions';
import type { ChatSentimentLabel } from '../types/chat-actions.types';

// GH-67 — thanh AI/Export cho Staff, đặt trên ô soạn reply. CHỈ dùng ở màn Staff ticket detail.
// Toolbar disable khi ticket đã đóng (prop disabled = ticketClosed từ [id].tsx).

const INTENTS: { key: ChatAiIntentEnum; label: string }[] = [
  { key: ChatAiIntentEnum.RequestInfo, label: 'Hỏi thêm' },
  { key: ChatAiIntentEnum.TechnicalAnswer, label: 'Kỹ thuật' },
  { key: ChatAiIntentEnum.Resolution, label: 'Giải pháp' },
  { key: ChatAiIntentEnum.FollowUp, label: 'Theo dõi' },
];

const SENTIMENT_VI: Record<ChatSentimentLabel, string> = {
  Positive: 'Tích cực 🙂',
  Neutral: 'Trung lập 😐',
  Negative: 'Tiêu cực 🙁',
  Critical: 'Nghiêm trọng 🚨',
};

interface Props {
  ticketId: string;
  disabled?: boolean;
  /** Chèn nội dung gợi ý vào ô soạn reply. */
  onInsert: (text: string) => void;
}

export function ChatAiToolbar({ ticketId, disabled = false, onInsert }: Props) {
  const [sheet, setSheet] = useState<'suggest' | 'summary' | null>(null);
  const [intent, setIntent] = useState<ChatAiIntentEnum>(ChatAiIntentEnum.TechnicalAnswer);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [summary, setSummary] = useState('');

  const suggest = useSuggestChat(ticketId);
  const summarize = useSummarizeThread(ticketId);
  const sentiment = useSentimentCheck(ticketId);
  const exportPdf = useExportChatPdf(ticketId);

  const runSuggest = (it: ChatAiIntentEnum) => {
    setIntent(it);
    suggest.mutate(it, { onSuccess: (dto) => setSuggestions(dto?.suggestions ?? []) });
  };

  const openSuggest = () => {
    setSuggestions([]);
    setSheet('suggest');
    runSuggest(intent);
  };

  const openSummary = () => {
    setSummary('');
    setSheet('summary');
    summarize.mutate(undefined, { onSuccess: (dto) => setSummary(dto?.summary ?? '') });
  };

  const runSentiment = () => {
    sentiment.mutate(undefined, {
      onSuccess: (dto) => {
        if (!dto) return;
        Alert.alert(
          'Cảm xúc khách hàng',
          `${SENTIMENT_VI[dto.label] ?? dto.label} · score ${dto.score.toFixed(2)}` +
            (dto.isAlertSent ? '\n\n⚠️ Đã gửi cảnh báo tới Manager.' : ''),
        );
      },
    });
  };

  return (
    <>
      <View style={styles.bar}>
        <ToolBtn icon="sparkles-outline" label="Gợi ý" loading={suggest.isPending} disabled={disabled} onPress={openSuggest} />
        <ToolBtn icon="document-text-outline" label="Tóm tắt" loading={summarize.isPending} disabled={disabled} onPress={openSummary} />
        <ToolBtn icon="happy-outline" label="Cảm xúc" loading={sentiment.isPending} disabled={disabled} onPress={runSentiment} />
        <ToolBtn icon="download-outline" label="PDF" loading={exportPdf.isPending} disabled={disabled} onPress={() => exportPdf.mutate()} />
      </View>

      {/* Gợi ý AI */}
      <BottomSheet visible={sheet === 'suggest'} onClose={() => setSheet(null)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Gợi ý trả lời (AI)</Text>
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
          {suggest.isPending ? (
            <ActivityIndicator color={Colors.primary} style={styles.sheetLoading} />
          ) : suggestions.length === 0 ? (
            <Text style={styles.empty}>Không có gợi ý.</Text>
          ) : (
            suggestions.map((s, i) => (
              <Pressable key={i} style={styles.suggestItem} onPress={() => { onInsert(s); setSheet(null); }}>
                <Text style={styles.suggestText}>{s}</Text>
                <Ionicons name="arrow-up-circle" size={20} color={Colors.primary} />
              </Pressable>
            ))
          )}
        </View>
      </BottomSheet>

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
        <Ionicons name={icon} size={16} color={disabled ? Colors.textFaint : Colors.primaryDark} />
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
  btnOff: { opacity: 0.5 },
  btnText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  btnTextOff: { color: Colors.textFaint },

  sheet: { gap: 12, paddingBottom: 8 },
  sheetTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  sheetLoading: { paddingVertical: 20 },
  empty: { fontSize: 13, color: Colors.textMute, textAlign: 'center', paddingVertical: 16 },
  intentRow: { flexDirection: 'row', gap: 6 },
  chip: { flex: 1, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.card2, alignItems: 'center' },
  chipActive: { backgroundColor: Colors.text },
  chipText: { fontSize: 11, fontWeight: '700', color: Colors.textMute },
  chipTextActive: { color: '#FFF' },
  suggestItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card2, borderRadius: 12, padding: 12,
  },
  suggestText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19 },
  summaryText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
});
