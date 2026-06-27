import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { Colors } from '../../../lib/theme';
import { TicketCommentDTO } from '../types/ticket.types';

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

export interface ChatBubbleProps {
  comment: TicketCommentDTO;
  isMe: boolean;
  imageHeaders?: { Authorization: string };
  onImagePress?: (uri: string) => void;
  /** Màu nền bubble của mình — mỗi app (customer/staff) giữ màu thương hiệu riêng. */
  accentColor?: string;
}

/** Bong bóng chat dùng chung customer + staff — tin của mình bên phải, người khác bên trái kèm avatar theo role. */
export function ChatBubble({
  comment,
  isMe,
  imageHeaders,
  onImagePress,
  accentColor = Colors.primary,
}: ChatBubbleProps) {
  const [showTime, setShowTime] = useState(false);

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
  const fileIds = comment.attachmentFileIds ?? [];
  const body = comment.body?.trim();
  // Tin trống (chỉ khoảng trắng) và không có ảnh — không render bubble rỗng gây dư khoảng trắng.
  if (!body && fileIds.length === 0) return null;

  const time = new Date(comment.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const showHeader = !isMe || comment.isInternal;
  const hasBody = !!body;
  const hasMedia = fileIds.length > 0;
  const bubbleColorStyle = isMe ? [styles.bubbleMe, { backgroundColor: accentColor }] : styles.bubbleOther;

  const header = showHeader ? (
    <View style={styles.bubbleHeader}>
      {!isMe && <Text style={styles.bubbleName}>{displayName}</Text>}
      {comment.isInternal && (
        <View style={styles.internalBadge}>
          <Ionicons name="lock-closed" size={9} color={Colors.warningDark} />
          <Text style={styles.internalBadgeText}>Nội bộ</Text>
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
          {hasBody && (
            <Pressable style={[styles.bubble, bubbleColorStyle]} onPress={() => setShowTime((v) => !v)}>
              {header}
              <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{body}</Text>
            </Pressable>
          )}
          {hasMedia && (
            <View style={[styles.bubble, bubbleColorStyle]}>
              {!hasBody && header}
              <View style={[styles.mediaWrap, styles.mediaWrapBleedBottom, { marginTop: !hasBody && showHeader ? 6 : -BUBBLE_PAD_Y }]}>
                <ChatImageGrid fileIds={fileIds} imageHeaders={imageHeaders} onImagePress={onImagePress} />
                <View style={styles.mediaTimeOverlay}>
                  <Text style={styles.mediaTimeOverlayText}>{time}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
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
});
