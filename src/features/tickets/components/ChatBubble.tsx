import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from '@/src/lib/date';
import { Colors, Shadow } from '@/src/lib/theme';
import { BottomSheet } from '@/src/shared/components/BottomSheet';
// Attachment images render via AuthImage (auto-attaches the auth header) instead of
// manually building the URL from BASE_URL + ENDPOINTS like before — so those two imports
// are no longer needed here.
import { AuthImage } from '@/src/features/file-storage/components/AuthImage';
import { ChatSeenRow } from './ChatSeenRow';
import { ReactionTypeEnum, TicketCommentDTO } from '../types/ticket.types';
import { VoiceMessageBubble } from './VoiceMessageBubble';
import { ReactionBar } from './ReactionBar';
import { isFileId, useAudioAttachment } from '../hooks/useAudioAttachment';
import { useRetryVoiceChat } from '../hooks/useTicketChatActions';
import { isWhitespaceOrEmojiOnly } from '@/src/shared/schemas/common.schema';

const ROLE_AVATAR: Record<string, { icon: keyof typeof Ionicons.glyphMap; iconColor: string; bg: string }> = {
  System:   { icon: 'server-outline',    iconColor: Colors.info,        bg: Colors.infoLight },
  Customer: { icon: 'person-outline',    iconColor: Colors.warningDark, bg: Colors.warningLight },
  Manager:  { icon: 'briefcase-outline', iconColor: Colors.primaryDark, bg: Colors.primaryLight },
  Staff:    { icon: 'shield-outline',    iconColor: Colors.primaryDark, bg: Colors.primaryLight },
};

const ROLE_FALLBACK_NAME: Record<string, string> = {
  System: 'System',
  Customer: 'Customer',
  Manager: 'Manager',
  Staff: 'Staff',
};

const LANGUAGE_OPTIONS = [
  { code: 'vi', label: 'Vietnamese' },
  { code: 'en', label: 'English' },
] as const;
const LANGUAGE_LABEL: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((l) => [l.code, l.label]),
);

// Image mosaic size inside the bubble — matches the negative marginHorizontal so images bleed to the bubble edge.
const GRID_W = 220;
const GRID_GAP = 2;
const GRID_HALF = (GRID_W - GRID_GAP) / 2;
const BUBBLE_PAD_X = 14;
const BUBBLE_PAD_Y = 10;

interface ImageTileProps {
  fileId: string;
  onPress: () => void;
  style: object;
  moreCount?: number;
}

function ImageTile({ fileId, onPress, style, moreCount }: ImageTileProps) {
  return (
    <Pressable style={[styles.gridTile, style]} onPress={onPress}>
      <AuthImage fileId={fileId} style={styles.gridImage} resizeMode="cover" />
      {!!moreCount && (
        <View style={styles.gridMoreOverlay}>
          <Text style={styles.gridMoreText}>+{moreCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

interface ChatImageGridProps {
  fileIds: (string | undefined)[];
  imageHeaders?: { Authorization: string };
  onImagePress?: (fileId: string) => void;
}

/** Messenger-style image mosaic — 1 large image / 2 side-by-side / 3 (2 top-1 bottom) / 4+ 2x2 grid + "+N" overlay. */
function ChatImageGrid({ fileIds, onImagePress }: ChatImageGridProps) {
  const images = fileIds.map((fileId, index) => ({
    fileId: fileId ?? '',
    key: fileId ?? `img-${index}`,
  }));
  const count = images.length;

  if (count === 1) {
    return (
      <ImageTile
        fileId={images[0].fileId}
        onPress={() => onImagePress?.(images[0].fileId)}
        style={styles.gridSingle}
      />
    );
  }

  if (count === 2) {
    return (
      <View style={styles.gridRow}>
        {images.map((image) => (
          <ImageTile
            key={image.key}
            fileId={image.fileId}
            onPress={() => onImagePress?.(image.fileId)}
            style={styles.gridHalfTall}
          />
        ))}
      </View>
    );
  }

  if (count === 3) {
    return (
      <View style={styles.gridCol}>
        <View style={styles.gridRow}>
          {images.slice(0, 2).map((image) => (
            <ImageTile
              key={image.key}
              fileId={image.fileId}
              onPress={() => onImagePress?.(image.fileId)}
              style={styles.gridHalf}
            />
          ))}
        </View>
        <ImageTile
          fileId={images[2].fileId}
          onPress={() => onImagePress?.(images[2].fileId)}
          style={styles.gridFull}
        />
      </View>
    );
  }

  // 4 or more images — 2x2 grid, 4th image overlays "+N" if there are more hidden images.
  const extra = count - 4;
  return (
    <View style={styles.gridCol}>
      <View style={styles.gridRow}>
        {images.slice(0, 2).map((image) => (
          <ImageTile
            key={image.key}
            fileId={image.fileId}
            onPress={() => onImagePress?.(image.fileId)}
            style={styles.gridHalf}
          />
        ))}
      </View>
      <View style={styles.gridRow}>
        {images.slice(2, 4).map((image, i) => (
          <ImageTile
            key={image.key}
            fileId={image.fileId}
            onPress={() => onImagePress?.(image.fileId)}
            style={styles.gridHalf}
            moreCount={i === 1 && extra > 0 ? extra : undefined}
          />
        ))}
      </View>
    </View>
  );
}

interface MenuAnchor {
  x: number;
  y: number;
}

interface ChatActionMenuProps {
  visible: boolean;
  anchor: MenuAnchor | null;
  onClose: () => void;
  canEdit: boolean;
  canDelete: boolean;
  canTranslate: boolean;
  canPin: boolean;
  canShowReaders: boolean;
  isPinned: boolean;
  canDownload: boolean;
  canSelectMany: boolean;
  translating: boolean;
  pinning: boolean;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onRequestSelectMode: () => void;
  onTranslate: (lang: string) => void;
  onTogglePin: () => void;
  onShowReaders: () => void;
  onDownload: () => void;
}

const POPUP_WIDTH = 190;
const MENU_ROW_HEIGHT = 42;
const SCREEN_MARGIN = 10;

/**
 * Edit/Translate/Delete menu opened on bubble long-press — a floating popup anchored at
 * the tap position (Messenger/Zalo style) instead of a bottom sheet sliding up from the
 * bottom of the screen.
 */
function ChatActionMenu({
  visible,
  anchor,
  onClose,
  canEdit,
  canDelete,
  canTranslate,
  canPin,
  canShowReaders,
  isPinned,
  canDownload,
  canSelectMany,
  translating,
  pinning,
  onEdit,
  onDeleteRequest,
  onRequestSelectMode,
  onTranslate,
  onTogglePin,
  onShowReaders,
  onDownload,
}: ChatActionMenuProps) {
  const [showLangs, setShowLangs] = useState(false);

  const handleClose = () => {
    onClose();
    setShowLangs(false);
  };

  if (!anchor) return null;

  const rowCount = showLangs
    ? LANGUAGE_OPTIONS.length + 1
    : Number(canEdit) + Number(canPin) + Number(canShowReaders) + Number(canDownload) + Number(canTranslate) + Number(canDelete) + Number(canSelectMany);
  const popupHeight = rowCount * MENU_ROW_HEIGHT + 12;
  const { width: screenW, height: screenH } = Dimensions.get('window');

  // Prefer showing ABOVE the tap point (like Messenger); if there's not enough room, show below.
  const top =
    anchor.y - popupHeight - 12 >= SCREEN_MARGIN
      ? anchor.y - popupHeight - 12
      : Math.min(anchor.y + 16, screenH - popupHeight - SCREEN_MARGIN);
  const left = Math.min(
    Math.max(anchor.x - POPUP_WIDTH / 2, SCREEN_MARGIN),
    screenW - POPUP_WIDTH - SCREEN_MARGIN,
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <View
          style={[styles.popup, Shadow, { top, left, width: POPUP_WIDTH }]}
          // Block taps inside the popup from propagating to the background Pressable (closes the menu).
          onStartShouldSetResponder={() => true}
        >
          {!showLangs ? (
            <>
              {canEdit && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onEdit(); }}>
                  <Ionicons name="create-outline" size={18} color={Colors.text} />
                  <Text style={styles.menuItemText}>Edit</Text>
                </Pressable>
              )}
              {canPin && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onTogglePin(); }} disabled={pinning}>
                  <Ionicons name={isPinned ? 'bookmark' : 'bookmark-outline'} size={18} color={Colors.primaryDark} />
                  <Text style={styles.menuItemText}>{isPinned ? 'Unpin' : 'Pin'}</Text>
                </Pressable>
              )}
              {canShowReaders && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onShowReaders(); }}>
                  <Ionicons name="checkmark-done-outline" size={18} color={Colors.text} />
                  <Text style={styles.menuItemText}>Read by</Text>
                </Pressable>
              )}
              {canDownload && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onDownload(); }}>
                  <Ionicons name="download-outline" size={18} color={Colors.text} />
                  <Text style={styles.menuItemText}>Download attachment</Text>
                </Pressable>
              )}
              {canTranslate && (
                <Pressable style={styles.menuItem} onPress={() => setShowLangs(true)} disabled={translating}>
                  <Ionicons name="language-outline" size={18} color={Colors.text} />
                  <Text style={styles.menuItemText}>{translating ? 'Translating...' : 'Translate to'}</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textFaint} style={styles.menuItemChevron} />
                </Pressable>
              )}
              {canDelete && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onDeleteRequest(); }}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  <Text style={[styles.menuItemText, { color: Colors.danger }]}>Delete</Text>
                </Pressable>
              )}
              {canSelectMany && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onRequestSelectMode(); }}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.text} />
                  <Text style={styles.menuItemText}>Select multiple</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <Pressable style={styles.menuItem} onPress={() => setShowLangs(false)}>
                <Ionicons name="chevron-back" size={18} color={Colors.text} />
                <Text style={styles.menuItemText}>Back</Text>
              </Pressable>
              {LANGUAGE_OPTIONS.map((l) => (
                <Pressable key={l.code} style={styles.menuItem} onPress={() => { handleClose(); onTranslate(l.code); }}>
                  <Text style={styles.menuItemText}>{l.label}</Text>
                </Pressable>
              ))}
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

export interface ChatBubbleProps {
  comment: TicketCommentDTO;
  isMe: boolean;
  imageHeaders?: { Authorization: string };
  onImagePress?: (fileId: string) => void;
  /** Background color for my own bubble — each app (customer/staff) keeps its own brand color. */
  accentColor?: string;

  // Edit/Delete/Translate — off by default (Customer screen doesn't pass these → keeps old behavior).
  canEdit?: boolean;
  canDelete?: boolean;
  /** Shows "Select multiple" in the menu — only enabled for my own messages. */
  canSelectMany?: boolean;
  onRequestSelectMode?: () => void;
  editNeedsReason?: boolean;
  deleteNeedsReason?: boolean;
  editPending?: boolean;
  deletePending?: boolean;
  onEdit?: (body: string, editReason?: string) => void;
  onDelete?: (reason?: string) => void;
  canTranslate?: boolean;
  translating?: boolean;
  onTranslate?: (targetLanguage: string) => void;
  translation?: { lang: string; text: string };
  showingOriginal?: boolean;
  onToggleOriginal?: () => void;

  // GH-67 — Pin (Staff/Manager/Admin). Customer screen doesn't pass this → off.
  canPin?: boolean;
  canShowReaders?: boolean;
  pinning?: boolean;
  onTogglePin?: () => void;
  onShowReaders?: () => void;

  // GH-68 — Reactions + download attachment. All roles.
  currentUserId?: string | null;
  onToggleReaction?: (type: ReactionTypeEnum, isActive: boolean) => void;
  /** Downloads all of the chat's attachments (fileIds) through the virus-scan gate. */
  onDownloadAttachments?: (fileIds: string[]) => void;
}

/** Chat bubble shared by customer + staff — my own messages on the right, others on the left with a role-based avatar. */
export function ChatBubble({
  comment,
  isMe,
  imageHeaders,
  onImagePress,
  accentColor = Colors.primary,
  canEdit = false,
  canDelete = false,
  canSelectMany = false,
  onRequestSelectMode,
  editNeedsReason = false,
  deleteNeedsReason = false,
  editPending = false,
  deletePending = false,
  onEdit,
  onDelete,
  canTranslate = false,
  translating = false,
  onTranslate,
  translation,
  showingOriginal = true,
  onToggleOriginal,
  canPin = false,
  canShowReaders = false,
  pinning = false,
  onTogglePin,
  onShowReaders,
  currentUserId = null,
  onToggleReaction,
  onDownloadAttachments,
}: ChatBubbleProps) {
  const [showTime, setShowTime] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  // GH-83 — retry transcription for a Failed voice chat. Placed here because `comment` already
  // has `ticketId` available, avoiding threading an extra prop through every screen rendering ChatBubble.
  const retryVoice = useRetryVoiceChat(comment.ticketId);
  const [editReason, setEditReason] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Filter out entries that aren't a GUID (junk/legacy URLs) — the exact cause of 404s when
  // building /api/files/{fullUrl}/download. Only keep valid fileIds to download the file.
  const fileIds = (comment.attachmentFileIds ?? []).filter(isFileId);
  const body = comment.body?.trim();
  const hasBody = !!body;
  // Voice message (BE creates it from /chats/voice): 1 audio attachment + transcript in the body.
  // Async transcription flow: a Pending/Processing/Failed chat has an EMPTY body but still must
  // render as a voice bubble (to show the status + retry button) → detected via
  // voiceTranscriptionStatus OR (has body + exactly 1 attachment). The hook queries metadata to
  // pin down the audio contentType when there's no status yet. Called BEFORE any early return to
  // not violate the Rules of Hooks.
  const voiceStatus = comment.voiceTranscriptionStatus ?? null;
  const voiceCandidateId =
    fileIds.length === 1 && (voiceStatus !== null || hasBody) ? fileIds[0] : undefined;
  const { isAudio } = useAudioAttachment(voiceCandidateId);
  const isVoice = !!voiceCandidateId && (voiceStatus !== null || isAudio === true);

  if (comment.authorRole === 'System') {
    return (
      <View style={styles.systemMsg}>
        <Text style={styles.systemMsgText}>{comment.body}</Text>
      </View>
    );
  }

  const avatar = ROLE_AVATAR[comment.authorRole] ?? ROLE_AVATAR.Staff;
  const displayName = isMe
    ? 'You'
    : comment.authorDisplayName ?? ROLE_FALLBACK_NAME[comment.authorRole] ?? comment.authorRole;
  // Empty message (whitespace only) and no image — don't render an empty bubble that adds extra whitespace.
  if (!body && fileIds.length === 0) return null;

  const canDownload = !!onDownloadAttachments && fileIds.length > 0;
  const canShowActions = canEdit || canDelete || canTranslate || canPin || canShowReaders || canDownload || canSelectMany;
  const displayBody = showingOriginal || !translation ? body : translation.text;

  const time = formatTime(comment.createdAt);

  const showHeader = !isMe || comment.isInternal || !!comment.isPinned;
  const hasMedia = fileIds.length > 0;
  const bubbleColorStyle = isMe ? [styles.bubbleMe, { backgroundColor: accentColor }] : styles.bubbleOther;

  const openMenu = (e: GestureResponderEvent) => {
    if (!canShowActions) return;
    setMenuAnchor({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
  };
  const startEdit = () => {
    setEditBody(comment.body);
    setEditReason('');
    setEditing(true);
  };
  // ChatBodyPolicy áp cho cả đường sửa, không riêng đường tạo — sửa thành "👍👍" sẽ bị BE
  // từ chối, nên chặn ngay ở nút Save thay vì để lỗi nổ sau khi gửi.
  const editBodyIsSendable =
    editBody.trim().length > 0 && !isWhitespaceOrEmojiOnly(editBody);
  const canSaveEdit =
    !editPending && editBodyIsSendable && !(editNeedsReason && !editReason.trim());

  const saveEdit = () => {
    if (!canSaveEdit) return;
    onEdit?.(editBody.trim(), editNeedsReason ? editReason.trim() : undefined);
    setEditing(false);
  };
  const confirmDelete = () => {
    onDelete?.(deleteNeedsReason ? deleteReason.trim() : undefined);
    setConfirmingDelete(false);
    setDeleteReason('');
  };

  const header = showHeader ? (
    <View style={styles.bubbleHeader}>
      {!isMe && <Text style={styles.bubbleName}>{displayName}</Text>}
      {comment.isInternal && (
        <View style={styles.internalBadge}>
          <Ionicons name="lock-closed" size={9} color={Colors.warningDark} />
          <Text style={styles.internalBadgeText}>Internal</Text>
        </View>
      )}
      {comment.isPinned && (
        <View style={styles.pinnedBadge}>
          <Ionicons name="bookmark" size={9} color={Colors.primaryDark} />
          <Text style={styles.pinnedBadgeText}>Pinned</Text>
        </View>
      )}
    </View>
  ) : null;

  // Has both a caption and images — split into 2 stacked bubbles (like 2 consecutive messages
  // on Messenger) instead of wrapping them in one block, to avoid a cluttered look.
  return (
    <View>
      {hasBody && showTime && <Text style={styles.timeOutside}>{time}</Text>}
      <View style={[styles.row, isMe && styles.rowMe]}>
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
            <Ionicons name={avatar.icon} size={14} color={avatar.iconColor} />
          </View>
        )}
        <View style={[styles.bubbleStack, { alignItems: isMe ? 'flex-end' : 'flex-start' }]}>
          {isVoice ? (
            <Pressable
              style={[styles.bubble, bubbleColorStyle]}
              onLongPress={openMenu}
            >
              {header}
              <VoiceMessageBubble
                fileId={voiceCandidateId!}
                transcript={displayBody}
                isMe={isMe}
                transcriptionStatus={comment.voiceTranscriptionStatus}
                onRetry={() => retryVoice.mutate(comment.id)}
                retrying={retryVoice.isPending}
              />
            </Pressable>
          ) : (
          <>
          {hasBody && (
            editing ? (
              <View style={[styles.bubble, styles.editBox]}>
                <TextInput
                  style={styles.editInput}
                  value={editBody}
                  onChangeText={setEditBody}
                  multiline
                  autoFocus
                />
                {editNeedsReason && (
                  <TextInput
                    style={styles.editReasonInput}
                    value={editReason}
                    onChangeText={setEditReason}
                    placeholder="Edit reason (required)..."
                    placeholderTextColor={Colors.textFaint}
                  />
                )}
                <View style={styles.editActions}>
                  <Pressable style={styles.editCancelBtn} onPress={() => setEditing(false)}>
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.editSaveBtn, !canSaveEdit && styles.btnDisabled]}
                    onPress={saveEdit}
                    disabled={!canSaveEdit}
                  >
                    {editPending ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.editSaveText}>Save</Text>}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={[styles.bubble, bubbleColorStyle]}
                onPress={() => setShowTime((v) => !v)}
                onLongPress={openMenu}
              >
                {header}
                <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{displayBody}</Text>
              </Pressable>
            )
          )}
          {hasMedia && (
            <Pressable
              style={[styles.bubble, bubbleColorStyle]}
              onLongPress={!hasBody ? openMenu : undefined}
            >
              {!hasBody && header}
              <View style={[styles.mediaWrap, styles.mediaWrapBleedBottom, { marginTop: !hasBody && showHeader ? 6 : -BUBBLE_PAD_Y }]}>
                <ChatImageGrid fileIds={fileIds} imageHeaders={imageHeaders} onImagePress={onImagePress} />
                <View style={styles.mediaTimeOverlay}>
                  <Text style={styles.mediaTimeOverlayText}>{time}</Text>
                </View>
              </View>
            </Pressable>
          )}
          </>
          )}

          {translation && !editing && (
            <Pressable onPress={onToggleOriginal} hitSlop={6}>
              <Text style={styles.translateToggle}>
                {showingOriginal
                  ? `View translation (${LANGUAGE_LABEL[translation.lang] ?? translation.lang})`
                  : 'View original'}
              </Text>
            </Pressable>
          )}

          {!!comment.editCount && comment.editCount > 0 && !editing && (
            <Text style={styles.editedTag}>edited</Text>
          )}

          {/* No reacting to a tombstone either — same reasoning as the action menu. */}
          {onToggleReaction && !editing && !comment.isDeleted && (
            <ReactionBar
              reactions={comment.reactions}
              currentUserId={currentUserId}
              onToggle={onToggleReaction}
              alignEnd={isMe}
            />
          )}

          {/* "Seen by" row, Messenger-style. BE only fills readReceipts on messages YOU sent,
              so this never renders under someone else's bubble. */}
          {isMe && !editing && !!comment.readReceipts?.length && (
            <ChatSeenRow readers={comment.readReceipts} />
          )}
        </View>
      </View>

      <ChatActionMenu
        visible={!!menuAnchor}
        anchor={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        canEdit={canEdit}
        canDelete={canDelete}
        canTranslate={canTranslate}
        canPin={canPin}
        canShowReaders={canShowReaders}
        isPinned={!!comment.isPinned}
        canDownload={canDownload}
        canSelectMany={canSelectMany}
        translating={translating}
        pinning={pinning}
        onEdit={startEdit}
        onDeleteRequest={() => setConfirmingDelete(true)}
        onRequestSelectMode={() => onRequestSelectMode?.()}
        onTranslate={(lang) => onTranslate?.(lang)}
        onTogglePin={() => onTogglePin?.()}
        onShowReaders={() => onShowReaders?.()}
        onDownload={() => onDownloadAttachments?.(fileIds)}
      />

      <BottomSheet visible={confirmingDelete} onClose={() => setConfirmingDelete(false)} scroll={false}>
        <View style={styles.menuBody}>
          <Text style={styles.deleteTitle}>Delete message?</Text>
          <Text style={styles.deleteDesc}>The message is removed from the conversation. You can&apos;t undo this yourself.</Text>
          {deleteNeedsReason && (
            <TextInput
              style={styles.editReasonInput}
              value={deleteReason}
              onChangeText={setDeleteReason}
              placeholder="Delete reason (required)..."
              placeholderTextColor={Colors.textFaint}
            />
          )}
          <View style={styles.editActions}>
            <Pressable style={styles.editCancelBtn} onPress={() => setConfirmingDelete(false)}>
              <Text style={styles.editCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.editSaveBtn, styles.deleteBtn, (deletePending || (deleteNeedsReason && !deleteReason.trim())) && styles.btnDisabled]}
              onPress={confirmDelete}
              disabled={deletePending || (deleteNeedsReason && !deleteReason.trim())}
            >
              {deletePending ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.editSaveText}>Delete</Text>}
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowMe: { flexDirection: 'row-reverse' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubbleStack: { gap: 4, maxWidth: '78%' },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: BUBBLE_PAD_X,
    paddingVertical: BUBBLE_PAD_Y,
    overflow: 'hidden',
  },
  bubbleOther: { backgroundColor: '#FFFFFF' },
  bubbleMe: {},
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  bubbleName: { fontSize: 11, fontWeight: '700', color: Colors.textMute },
  bubbleText: { fontSize: 13.5, fontWeight: '500', color: Colors.text, lineHeight: 19 },
  // My own bubble's background is yellow #FFD500 — white text is only ~1.4:1 contrast,
  // nearly sinking into the background. Use dark ink instead for legibility (~11:1).
  bubbleTextMe: { color: Colors.text },
  // A sibling positioned BEFORE `row` (not inside bubbleStack) ⇒ spans the full screen width,
  // appears above the bubble, and textAlign center pulls the time to the middle of the whole
  // chat — not offset toward the bubble's isMe side.
  timeOutside: { fontSize: 11, color: Colors.textMute, marginBottom: 4, textAlign: 'center' },

  internalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.warningLight, borderRadius: 999,
    paddingHorizontal: 6, paddingVertical: 1.5,
  },
  internalBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.warningDark },

  pinnedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primaryLight, borderRadius: 999,
    paddingHorizontal: 6, paddingVertical: 1.5,
  },
  pinnedBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.primaryDark },

  // Bleed images to the bubble's horizontal edge (cancels the bubble's horizontal padding) —
  // `overflow:hidden` on the bubble auto-rounds the image corners to the bubble's borderRadius,
  // so no need to set a separate radius for the image.
  mediaWrap: { marginHorizontal: -BUBBLE_PAD_X, position: 'relative' },
  mediaWrapBleedBottom: { marginBottom: -BUBBLE_PAD_Y },

  gridRow: { flexDirection: 'row', gap: GRID_GAP },
  gridCol: { gap: GRID_GAP },
  gridTile: { backgroundColor: 'rgba(0,0,0,0.04)' },
  gridImage: { width: '100%', height: '100%' },
  gridSingle: { width: GRID_W, height: 230 },
  gridHalfTall: { width: GRID_HALF, height: 150 },
  gridHalf: { width: GRID_HALF, height: 109 },
  gridFull: { width: GRID_W, height: 109 },
  gridMoreOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  gridMoreText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },

  mediaTimeOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2,
  },
  mediaTimeOverlayText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },

  systemMsg: { alignItems: 'center', paddingVertical: 4 },
  systemMsgText: { fontSize: 11, color: Colors.textMute, fontStyle: 'italic', fontWeight: '600' },

  translateToggle: {
    fontSize: 10.5, color: Colors.textMute, textDecorationLine: 'underline', paddingHorizontal: 4,
  },
  editedTag: { fontSize: 10, color: Colors.textFaint, paddingHorizontal: 4, fontStyle: 'italic' },

  popup: {
    position: 'absolute',
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  menuBody: { gap: 4, paddingBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 4 },
  menuItemText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  menuItemChevron: { marginLeft: 'auto' },

  deleteTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  deleteDesc: { fontSize: 13, color: Colors.textMute, marginTop: 2, marginBottom: 4 },

  editBox: { backgroundColor: Colors.card2, width: 260, gap: 8 },
  editInput: {
    fontSize: 13.5, color: Colors.text, minHeight: 40, maxHeight: 120,
    textAlignVertical: 'top',
  },
  editReasonInput: {
    backgroundColor: Colors.card2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 13, color: Colors.text,
  },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  editCancelBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  editCancelText: { fontSize: 13, fontWeight: '700', color: Colors.textMute },
  editSaveBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', minWidth: 60,
  },
  editSaveText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  deleteBtn: { backgroundColor: Colors.danger },
  btnDisabled: { opacity: 0.4 },
});
