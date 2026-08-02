import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { Colors, Shadow } from '../../../lib/theme';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { ReactionTypeEnum, TicketCommentDTO } from '../types/ticket.types';
import { VoiceMessageBubble } from './VoiceMessageBubble';
import { ReactionBar } from './ReactionBar';
import { isFileId, useAudioAttachment } from '../hooks/useAudioAttachment';
import { useRetryVoiceChat } from '../hooks/useTicketChatActions';

const ROLE_AVATAR: Record<string, { icon: keyof typeof Ionicons.glyphMap; iconColor: string; bg: string }> = {
  System:   { icon: 'server-outline',    iconColor: Colors.info,        bg: Colors.infoLight },
  Customer: { icon: 'person-outline',    iconColor: Colors.warningDark, bg: Colors.warningLight },
  Manager:  { icon: 'briefcase-outline', iconColor: Colors.primaryDark, bg: Colors.primaryLight },
  Staff:    { icon: 'shield-outline',    iconColor: Colors.primaryDark, bg: Colors.primaryLight },
};

const ROLE_FALLBACK_NAME: Record<string, string> = {
  System: 'Hệ thống',
  Customer: 'Khách hàng',
  Manager: 'Manager',
  Staff: 'Nhân viên',
};

const LANGUAGE_OPTIONS = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
] as const;
const LANGUAGE_LABEL: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((l) => [l.code, l.label]),
);

// Kích thước mosaic ảnh trong bubble — khớp với marginHorizontal âm để ảnh tràn sát viền bubble.
const GRID_W = 220;
const GRID_GAP = 2;
const GRID_HALF = (GRID_W - GRID_GAP) / 2;
const BUBBLE_PAD_X = 14;
const BUBBLE_PAD_Y = 10;

interface ImageTileProps {
  uri: string;
  imageHeaders?: { Authorization: string };
  onPress: () => void;
  style: object;
  moreCount?: number;
}

function ImageTile({ uri, imageHeaders, onPress, style, moreCount }: ImageTileProps) {
  return (
    <Pressable style={[styles.gridTile, style]} onPress={onPress}>
      <Image source={{ uri, headers: imageHeaders }} style={styles.gridImage} resizeMode="cover" />
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
  onImagePress?: (uri: string) => void;
}

/** Mosaic ảnh kiểu Messenger — 1 ảnh lớn / 2 ảnh đôi / 3 ảnh (2 trên-1 dưới) / 4+ ảnh lưới 2x2 + overlay "+N". */
function ChatImageGrid({ fileIds, imageHeaders, onImagePress }: ChatImageGridProps) {
  const uris = fileIds.map((fid, i) => ({ fid: fid ?? `img-${i}`, uri: `${BASE_URL}${ENDPOINTS.FILES.DOWNLOAD(fid ?? '')}` }));
  const count = uris.length;

  if (count === 1) {
    return (
      <ImageTile
        uri={uris[0].uri}
        imageHeaders={imageHeaders}
        onPress={() => onImagePress?.(uris[0].uri)}
        style={styles.gridSingle}
      />
    );
  }

  if (count === 2) {
    return (
      <View style={styles.gridRow}>
        {uris.map((it) => (
          <ImageTile
            key={it.fid}
            uri={it.uri}
            imageHeaders={imageHeaders}
            onPress={() => onImagePress?.(it.uri)}
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
          {uris.slice(0, 2).map((it) => (
            <ImageTile
              key={it.fid}
              uri={it.uri}
              imageHeaders={imageHeaders}
              onPress={() => onImagePress?.(it.uri)}
              style={styles.gridHalf}
            />
          ))}
        </View>
        <ImageTile
          uri={uris[2].uri}
          imageHeaders={imageHeaders}
          onPress={() => onImagePress?.(uris[2].uri)}
          style={styles.gridFull}
        />
      </View>
    );
  }

  // 4 ảnh trở lên — lưới 2x2, ảnh thứ 4 overlay "+N" nếu còn ảnh ẩn.
  const extra = count - 4;
  return (
    <View style={styles.gridCol}>
      <View style={styles.gridRow}>
        {uris.slice(0, 2).map((it) => (
          <ImageTile
            key={it.fid}
            uri={it.uri}
            imageHeaders={imageHeaders}
            onPress={() => onImagePress?.(it.uri)}
            style={styles.gridHalf}
          />
        ))}
      </View>
      <View style={styles.gridRow}>
        {uris.slice(2, 4).map((it, i) => (
          <ImageTile
            key={it.fid}
            uri={it.uri}
            imageHeaders={imageHeaders}
            onPress={() => onImagePress?.(it.uri)}
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
  translating: boolean;
  pinning: boolean;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onTranslate: (lang: string) => void;
  onTogglePin: () => void;
  onShowReaders: () => void;
  onDownload: () => void;
}

const POPUP_WIDTH = 190;
const MENU_ROW_HEIGHT = 42;
const SCREEN_MARGIN = 10;

/**
 * Menu Sửa/Dịch/Xóa mở khi long-press bubble — popup nổi neo tại vị trí nhấn
 * (kiểu Messenger/Zalo) thay vì bottom sheet trượt từ đáy màn hình lên.
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
  translating,
  pinning,
  onEdit,
  onDeleteRequest,
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
    : Number(canEdit) + Number(canPin) + Number(canShowReaders) + Number(canDownload) + Number(canTranslate) + Number(canDelete);
  const popupHeight = rowCount * MENU_ROW_HEIGHT + 12;
  const { width: screenW, height: screenH } = Dimensions.get('window');

  // Ưu tiên hiện phía TRÊN điểm nhấn (giống Messenger); nếu không đủ chỗ thì hiện phía dưới.
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
          // Chặn tap bên trong popup lan ra Pressable nền (đóng menu) phía sau.
          onStartShouldSetResponder={() => true}
        >
          {!showLangs ? (
            <>
              {canEdit && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onEdit(); }}>
                  <Ionicons name="create-outline" size={18} color={Colors.text} />
                  <Text style={styles.menuItemText}>Sửa</Text>
                </Pressable>
              )}
              {canPin && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onTogglePin(); }} disabled={pinning}>
                  <Ionicons name={isPinned ? 'bookmark' : 'bookmark-outline'} size={18} color={Colors.primaryDark} />
                  <Text style={styles.menuItemText}>{isPinned ? 'Bỏ ghim' : 'Ghim'}</Text>
                </Pressable>
              )}
              {canShowReaders && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onShowReaders(); }}>
                  <Ionicons name="checkmark-done-outline" size={18} color={Colors.text} />
                  <Text style={styles.menuItemText}>Đã đọc bởi</Text>
                </Pressable>
              )}
              {canDownload && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onDownload(); }}>
                  <Ionicons name="download-outline" size={18} color={Colors.text} />
                  <Text style={styles.menuItemText}>Tải tệp đính kèm</Text>
                </Pressable>
              )}
              {canTranslate && (
                <Pressable style={styles.menuItem} onPress={() => setShowLangs(true)} disabled={translating}>
                  <Ionicons name="language-outline" size={18} color={Colors.text} />
                  <Text style={styles.menuItemText}>{translating ? 'Đang dịch...' : 'Dịch sang'}</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textFaint} style={styles.menuItemChevron} />
                </Pressable>
              )}
              {canDelete && (
                <Pressable style={styles.menuItem} onPress={() => { handleClose(); onDeleteRequest(); }}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  <Text style={[styles.menuItemText, { color: Colors.danger }]}>Xóa</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <Pressable style={styles.menuItem} onPress={() => setShowLangs(false)}>
                <Ionicons name="chevron-back" size={18} color={Colors.text} />
                <Text style={styles.menuItemText}>Quay lại</Text>
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
  onImagePress?: (uri: string) => void;
  /** Màu nền bubble của mình — mỗi app (customer/staff) giữ màu thương hiệu riêng. */
  accentColor?: string;

  // Sửa/Xóa/Dịch — mặc định tắt (Customer screen không truyền → giữ nguyên hành vi cũ).
  canEdit?: boolean;
  canDelete?: boolean;
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

  // GH-67 — Ghim (Staff/Manager/Admin). Customer screen không truyền → tắt.
  canPin?: boolean;
  canShowReaders?: boolean;
  pinning?: boolean;
  onTogglePin?: () => void;
  onShowReaders?: () => void;

  // GH-68 — Reactions + download attachment. Mọi role.
  currentUserId?: string | null;
  onToggleReaction?: (type: ReactionTypeEnum, isActive: boolean) => void;
  /** Tải toàn bộ attachment của chat (fileIds) qua virus-scan gate. */
  onDownloadAttachments?: (fileIds: string[]) => void;
}

/** Bong bóng chat dùng chung customer + staff — tin của mình bên phải, người khác bên trái kèm avatar theo role. */
export function ChatBubble({
  comment,
  isMe,
  imageHeaders,
  onImagePress,
  accentColor = Colors.primary,
  canEdit = false,
  canDelete = false,
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
  // GH-83 — retry transcribe cho chat voice Failed. Đặt ở đây vì `comment` đã có sẵn `ticketId`,
  // khỏi phải luồn thêm prop qua mọi màn đang render ChatBubble.
  const retryVoice = useRetryVoiceChat(comment.ticketId);
  const [editReason, setEditReason] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Lọc bỏ entry không phải GUID (URL rác/legacy) — chính là nguyên nhân 404 khi ghép
  // /api/files/{fullUrl}/download. Chỉ giữ fileId hợp lệ để tải file.
  const fileIds = (comment.attachmentFileIds ?? []).filter(isFileId);
  const body = comment.body?.trim();
  const hasBody = !!body;
  // Voice message (BE tạo từ /chats/voice): 1 attachment audio + transcript trong body.
  // Luồng transcribe async: chat Pending/Processing/Failed có body RỖNG nhưng vẫn phải render
  // như voice bubble (để hiện trạng thái + nút thử lại) → nhận diện qua voiceTranscriptionStatus
  // HOẶC (có body + đúng 1 attachment). Hook hỏi metadata để chốt contentType audio khi chưa
  // có status. Gọi TRƯỚC mọi early return để không vi phạm Rules of Hooks.
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
    ? 'Bạn'
    : comment.authorDisplayName ?? ROLE_FALLBACK_NAME[comment.authorRole] ?? comment.authorRole;
  // Tin trống (chỉ khoảng trắng) và không có ảnh — không render bubble rỗng gây dư khoảng trắng.
  if (!body && fileIds.length === 0) return null;

  const canDownload = !!onDownloadAttachments && fileIds.length > 0;
  const canShowActions = canEdit || canDelete || canTranslate || canPin || canShowReaders || canDownload;
  const displayBody = showingOriginal || !translation ? body : translation.text;

  const time = new Date(comment.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

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
  const saveEdit = () => {
    if (!editBody.trim()) return;
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
          <Text style={styles.internalBadgeText}>Nội bộ</Text>
        </View>
      )}
      {comment.isPinned && (
        <View style={styles.pinnedBadge}>
          <Ionicons name="bookmark" size={9} color={Colors.primaryDark} />
          <Text style={styles.pinnedBadgeText}>Đã ghim</Text>
        </View>
      )}
    </View>
  ) : null;

  // Có cả caption và ảnh — tách thành 2 bubble riêng xếp chồng (giống 2 tin nhắn liên tiếp
  // trên Messenger), không bọc chung 1 khối để tránh nhìn rối.
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
                    placeholder="Lý do chỉnh sửa (bắt buộc)..."
                    placeholderTextColor={Colors.textFaint}
                  />
                )}
                <View style={styles.editActions}>
                  <Pressable style={styles.editCancelBtn} onPress={() => setEditing(false)}>
                    <Text style={styles.editCancelText}>Hủy</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.editSaveBtn, (editPending || !editBody.trim() || (editNeedsReason && !editReason.trim())) && styles.btnDisabled]}
                    onPress={saveEdit}
                    disabled={editPending || !editBody.trim() || (editNeedsReason && !editReason.trim())}
                  >
                    {editPending ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.editSaveText}>Lưu</Text>}
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
                  ? `Xem bản dịch (${LANGUAGE_LABEL[translation.lang] ?? translation.lang})`
                  : 'Xem bản gốc'}
              </Text>
            </Pressable>
          )}

          {!!comment.editCount && comment.editCount > 0 && !editing && (
            <Text style={styles.editedTag}>đã chỉnh sửa</Text>
          )}

          {onToggleReaction && !editing && (
            <ReactionBar
              reactions={comment.reactions}
              currentUserId={currentUserId}
              onToggle={onToggleReaction}
              alignEnd={isMe}
            />
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
        translating={translating}
        pinning={pinning}
        onEdit={startEdit}
        onDeleteRequest={() => setConfirmingDelete(true)}
        onTranslate={(lang) => onTranslate?.(lang)}
        onTogglePin={() => onTogglePin?.()}
        onShowReaders={() => onShowReaders?.()}
        onDownload={() => onDownloadAttachments?.(fileIds)}
      />

      <BottomSheet visible={confirmingDelete} onClose={() => setConfirmingDelete(false)} scroll={false}>
        <View style={styles.menuBody}>
          <Text style={styles.deleteTitle}>Xóa bình luận?</Text>
          <Text style={styles.deleteDesc}>Hành động này không thể hoàn tác.</Text>
          {deleteNeedsReason && (
            <TextInput
              style={styles.editReasonInput}
              value={deleteReason}
              onChangeText={setDeleteReason}
              placeholder="Lý do xóa (bắt buộc)..."
              placeholderTextColor={Colors.textFaint}
            />
          )}
          <View style={styles.editActions}>
            <Pressable style={styles.editCancelBtn} onPress={() => setConfirmingDelete(false)}>
              <Text style={styles.editCancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              style={[styles.editSaveBtn, styles.deleteBtn, (deletePending || (deleteNeedsReason && !deleteReason.trim())) && styles.btnDisabled]}
              onPress={confirmDelete}
              disabled={deletePending || (deleteNeedsReason && !deleteReason.trim())}
            >
              {deletePending ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.editSaveText}>Xóa</Text>}
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
  bubbleTextMe: { color: '#FFFFFF' },
  // Là sibling đứng TRƯỚC `row` (không nằm trong bubbleStack) ⇒ rộng full màn hình, hiện
  // phía trên đầu bong bóng, textAlign center kéo giờ ra giữa toàn bộ chat — không lệch
  // theo phía isMe của bong bóng.
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

  // Tràn ảnh ra sát viền ngang bubble (huỷ padding ngang của bubble) — `overflow:hidden` trên
  // bubble tự bo góc ảnh theo borderRadius của bubble, không cần set radius riêng cho ảnh.
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
