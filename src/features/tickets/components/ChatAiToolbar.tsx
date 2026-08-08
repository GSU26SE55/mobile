import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/lib/theme';
import { BottomSheet } from '@/src/shared/components/BottomSheet';
import { ChatAiIntentEnum } from '@/src/features/tickets/enums/chat.enum';
import { useSuggestChat, useSummarizeThread } from '../hooks/useTicketChatActions';

// GH-67 — AI/Export bar for Staff, placed above the reply composer. ONLY used on the Staff ticket detail screen.
// Toolbar disables when the ticket is closed (prop disabled = ticketClosed from [id].tsx).

const INTENTS: { key: ChatAiIntentEnum; label: string }[] = [
  { key: ChatAiIntentEnum.RequestInfo, label: 'Ask more' },
  { key: ChatAiIntentEnum.TechnicalAnswer, label: 'Technical' },
  { key: ChatAiIntentEnum.Resolution, label: 'Solution' },
  { key: ChatAiIntentEnum.FollowUp, label: 'Follow up' },
];

interface Props {
  ticketId: string;
  disabled?: boolean;
  /** Suggestion result → parent renders it as a bubble at the END of the chat thread (like web). */
  onSuggestions: (suggestions: string[]) => void;
}

export function ChatAiToolbar({ ticketId, disabled = false, onSuggestions }: Props) {
  const [sheet, setSheet] = useState<'summary' | null>(null);
  // Tap "Suggest" → shows the intent chip row (compact). Selecting a chip generates and
  // pushes a bubble into the chat.
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
        setIntentRowOpen(false); // generation done → collapse the chip row, bubble already shown in chat
      },
    });
  };

  const openSuggest = () => {
    setIntent(null);
    setIntentRowOpen((v) => !v); // toggle the chip row
  };

  const openSummary = () => {
    setSummary('');
    setSheet('summary');
    summarize.mutate(undefined, { onSuccess: (dto) => setSummary(dto?.summary ?? '') });
  };

  return (
    <>
      <View style={styles.bar}>
        <ToolBtn icon="sparkles-outline" label="Suggest" loading={suggest.isPending} disabled={disabled} onPress={openSuggest} />
        <ToolBtn icon="document-text-outline" label="Summarize" loading={summarize.isPending} disabled={disabled} onPress={openSummary} />
      </View>

      {/* AI suggestion — just the intent chip row. Pick a type → generate → bubble appears at the END of chat. */}
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

      {/* Summary */}
      <BottomSheet visible={sheet === 'summary'} onClose={() => setSheet(null)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Conversation summary</Text>
          {summarize.isPending ? (
            <ActivityIndicator color={Colors.primary} style={styles.sheetLoading} />
          ) : (
            <Text style={styles.summaryText}>{summary || 'No content.'}</Text>
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
  // Previously used opacity 0.5 layered on top of yellow text #D9A000 on background
  // #FFF6D6 (already weak ~2.4:1) → button became too faint to read. Now changing the
  // BACKGROUND to gray instead of lowering opacity keeps the text dark enough to read
  // the button's label even while it's disabled.
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
