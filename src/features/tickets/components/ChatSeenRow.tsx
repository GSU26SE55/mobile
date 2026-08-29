import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/src/lib/theme';
import type { ChatReaderDTO } from '../types/chat-actions.types';

/** Avatars drawn inline; the rest collapse into a "+N". */
const MAX_VISIBLE = 3;
const SIZE = 14;

/**
 * BE falls back to the raw userId when the account isn't in its synced read-model
 * (CustomerAccounts/StaffAccounts) — a real case in dev, and after an account is deleted.
 * A UUID initial renders as a meaningless "0"/"d", so treat it as unresolved.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUnresolved(r: ChatReaderDTO) {
  const n = r.displayName?.trim();
  return !n || n === r.userId || UUID_RE.test(n);
}

function initial(r: ChatReaderDTO) {
  if (isUnresolved(r)) return '?';
  return (r.displayName.trim()[0] ?? '?').toUpperCase();
}

interface Props {
  readers: ChatReaderDTO[];
}

/**
 * Messenger-style "seen by" row under a message you sent.
 *
 * Only rendered for your OWN messages — BE fills `readReceipts` there only, since a reader
 * list under someone else's bubble is noise nobody asked for.
 *
 * Kept deliberately small and unlabelled: it sits under every one of your messages, so more
 * visual weight would compete with the message itself. Tapping a message still opens the full
 * reader list (ChatReadersSheet) for Staff.
 */
export function ChatSeenRow({ readers }: Props) {
  // Newest first, so the most recent reader survives truncation. Sorted on a copy — the array
  // comes straight from the query cache.
  const sorted = useMemo(
    () => [...readers].sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime()),
    [readers],
  );

  if (sorted.length === 0) return null;

  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = sorted.length - visible.length;

  return (
    <View
      style={styles.row}
      accessibilityLabel={`Seen by ${sorted.length} ${sorted.length === 1 ? 'person' : 'people'}`}
    >
      {visible.map((r, i) =>
        r.avatarUrl ? (
          <Image
            key={r.userId}
            source={{ uri: r.avatarUrl }}
            style={[styles.avatar, i > 0 && styles.overlap]}
          />
        ) : (
          <View key={r.userId} style={[styles.avatar, styles.fallback, i > 0 && styles.overlap]}>
            <Text style={styles.fallbackText}>{initial(r)}</Text>
          </View>
        ),
      )}
      {overflow > 0 && <Text style={styles.more}>+{overflow}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginTop: 2 },
  avatar: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: Colors.white,
    backgroundColor: Colors.card3,
  },
  // Negative margin makes the avatars overlap the way a stacked group reads.
  overlap: { marginLeft: -4 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontSize: 8, lineHeight: 10, color: Colors.textMute, fontWeight: '700' },
  more: { fontSize: 10, color: Colors.textFaint, marginLeft: 3 },
});
