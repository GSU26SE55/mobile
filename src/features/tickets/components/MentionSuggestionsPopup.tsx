import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from '../../../features/batteries/components/EnergyBackdrop';
import { Solar } from '../../../lib/theme';
import { MentionTarget, useMentionTargets } from '../hooks/useMentionTargets';

export type { MentionTarget };

interface MentionSuggestionsPopupProps {
  text: string;
  ticketId?: string;
  onSelectMention: (selectedTag: string) => void;
  customTargets?: MentionTarget[];
}

export function MentionSuggestionsPopup({
  text,
  ticketId,
  onSelectMention,
  customTargets = [],
}: MentionSuggestionsPopupProps) {
  const match = useMemo(() => text.match(/@([a-zA-Z0-9_.-]*)$/), [text]);
  const { targets: dynamicTargets, isLoading } = useMentionTargets(ticketId, !!match);

  const filtered = useMemo(() => {
    if (!match) return [];
    const query = match[1].toLowerCase();
    const all = [...dynamicTargets, ...customTargets];

    const uniqueMap = new Map<string, MentionTarget>();
    all.forEach((item) => uniqueMap.set(item.tag.toLowerCase(), item));
    const list = Array.from(uniqueMap.values());

    if (!query) return list;
    return list.filter(
      (item) =>
        item.tag.toLowerCase().includes(query) ||
        (item.name && item.name.toLowerCase().includes(query)),
    );
  }, [match, dynamicTargets, customTargets]);

  if (!match) return null;

  return (
    <GlassSurface style={styles.popupContainer} warm>
      <View style={styles.header}>
        <Ionicons name="at-circle-outline" size={16} color={Solar.yellowDeep} />
        <Text style={styles.headerTitle}>Gắn thẻ (@mention)</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Solar.yellowDeep} />
          <Text style={styles.loadingText}>Đang tải dữ liệu từ Server…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Không tìm thấy thành viên</Text>
        </View>
      ) : (
        filtered.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => onSelectMention(item.tag)}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={16} color={Solar.ink} />
            </View>

            <View style={styles.body}>
              <Text style={styles.tagText}>{item.tag}</Text>
              {!!item.name && <Text style={styles.nameText}>{item.name}</Text>}
            </View>

            <Ionicons name="add-circle" size={20} color={Solar.yellowDeep} />
          </Pressable>
        ))
      )}
    </GlassSurface>
  );
}

export function renderMentionedText(
  content: string,
  baseStyle: any,
  mentionStyle: any = styles.mentionChipText,
) {
  if (!content || !content.includes('@')) {
    return <Text style={baseStyle}>{content}</Text>;
  }

  const parts = content.split(/(@[a-zA-Z0-9_.-]+)/g);

  return (
    <Text style={baseStyle}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          return (
            <Text key={i} style={[baseStyle, mentionStyle]}>
              {part}{' '}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  popupContainer: {
    marginBottom: 8,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.96)',
    shadowColor: '#8C7A4B',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(235, 230, 215, 0.6)',
  },
  headerTitle: { fontSize: 11, fontWeight: '800', color: Solar.mute },
  loadingBox: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  loadingText: { fontSize: 11, color: Solar.mute, fontWeight: '600' },
  emptyBox: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 11, color: Solar.mute, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagText: { fontSize: 13, fontWeight: '900', color: Solar.ink },
  nameText: { fontSize: 12, fontWeight: '700', color: Solar.mute },
  mentionChipText: {
    color: '#1C1C1E',
    backgroundColor: '#FFD500',
    fontWeight: '900',
  },
  pressed: { opacity: 0.7, backgroundColor: 'rgba(255, 213, 0, 0.15)' },
});
