import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HttpError } from '../../../src/lib/errors';
import { P } from '../../../src/lib/authz';
import { PermissionGuard } from '../../../src/features/auth/components/PermissionGuard';
import { ActivityTimeline } from '../../../src/features/tickets/components/ActivityTimeline';
import { CommentThread } from '../../../src/features/tickets/components/CommentThread';
import {
  ChatSelectionHeader,
  ChatSelectionFooter,
} from '../../../src/features/tickets/components/ChatSelectionBar';
import { RateModal } from '../../../src/features/tickets/components/RateModal';
import { ReopenModal } from '../../../src/features/tickets/components/ReopenModal';
import { SlaCountdown } from '../../../src/features/tickets/components/SlaCountdown';
import { TicketStatusBadge } from '../../../src/features/tickets/components/TicketStatusBadge';
import { useAddComment } from '../../../src/features/tickets/hooks/useAddComment';
import { useRateTicket } from '../../../src/features/tickets/hooks/useRateTicket';
import { useReopenTicket } from '../../../src/features/tickets/hooks/useReopenTicket';
import { useUploadCommentAttachment } from '../../../src/features/tickets/hooks/useUploadCommentAttachment';
import { useTicketDetail } from '../../../src/features/tickets/hooks/useTicketDetail';
import { MentionSuggestionsPopup } from '../../../src/features/tickets/components/MentionSuggestionsPopup';
import { useTicketChatsCursor } from '../../../src/features/tickets/hooks/useTicketChatsCursor';
import { useAddReaction, useRemoveReaction } from '../../../src/features/tickets/hooks/useChatReactions';
import { useDownloadChatAttachment } from '../../../src/features/tickets/hooks/useDownloadChatAttachment';
import { useTicketUnreadCount } from '../../../src/features/tickets/hooks/useTicketUnreadCount';
import { useTicketActivities } from '../../../src/features/tickets/hooks/useTicketActivities';
import { useTicketCommentsRealtime } from '../../../src/features/tickets/hooks/useTicketCommentsRealtime';
import {
  useUpdateTicketChat,
  useDeleteTicketChat,
  useBulkDeleteTicketChats,
  useMarkTicketChatsRead,
  useTranslateTicketChat,
  useTranscribeVoiceChat,
} from '../../../src/features/tickets/hooks/useTicketChatActions';
import { useVoiceRecorder } from '../../../src/features/tickets/hooks/useVoiceRecorder';
import { VoiceRecordingModal } from '../../../src/features/tickets/components/VoiceRecordingModal';
import { TypingIndicator } from '../../../src/features/tickets/components/TypingIndicator';
import { useAuthImageHeaders } from '../../../src/features/file-storage/hooks/useAuthImageHeaders';
import { AuthImage } from '../../../src/features/file-storage/components/AuthImage';
import { AttachmentForm } from '../../../src/features/tickets/schemas/comment.schema';
import { RatePayload, ReopenPayload, TicketStatusEnum } from '../../../src/features/tickets/types/ticket.types';
import type { ChatMentionInput } from '../../../src/features/tickets/types/ticket.types';
import { BadgeColors, Colors, Shadow, ShadowPrimary } from '../../../src/lib/theme';
import { useMyBatteryAssets } from '../../../src/features/batteries/hooks/useMyBatteryAssets';
import { BatteryAssetDto } from '../../../src/features/batteries/types/battery.types';
import { useSessionStore } from '../../../src/stores/sessionStore';

const PRIORITY_MAP: Record<string, { label: string; badge: keyof typeof BadgeColors }> = {
  P1Critical: { label: 'P1 Critical', badge: 'p1' },
  P2High:     { label: 'P2 High',     badge: 'p2' },
  P3Normal:   { label: 'P3 Standard', badge: 'p3' },
};

const CATEGORY_LABEL: Record<string, string> = {
  Charging: 'Sạc pin',
  Overheat: 'Quá nhiệt',
  NoPower: 'Mất điện',
  Performance: 'Hiệu suất',
  Repair: 'Sửa chữa',
  Other: 'Khác',
};

/**
 * `toLocaleString('vi-VN')` cho ra "13:31:16 13/7/2026" — giây là nhiễu và ngày
 * không pad 0 nên độ dài nhảy lung tung giữa các dòng. Cố định "HH:mm dd/MM/yyyy".
 */
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

function PriorityBadge({ priority }: { priority: string | null }) {
  // priority null khi ticket chưa triage — hiển thị nhãn trung tính, không nhầm P3.
  const cfg = priority
    ? (PRIORITY_MAP[priority] ?? { label: priority, badge: 'p3' as const })
    : { label: 'Chưa phân loại', badge: 'p3' as const };
  const bc = BadgeColors[cfg.badge];
  return (
    <View style={[styles.badge, { backgroundColor: bc.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: bc.text }]} />
      <Text style={[styles.badgeLabel, { color: bc.text }]}>{cfg.label}</Text>
    </View>
  );
}

const STEP_CONFIGS = [
  { key: 'create', label: 'Tạo mới' },
  { key: 'accept', label: 'Tiếp nhận' },
  { key: 'assign', label: 'Phân công' },
  { key: 'progress', label: 'Đang xử lý' },
  { key: 'resolve', label: 'Đã xử lý' },
  { key: 'close', label: 'Đã đóng' },
];

function HorizontalStepper({ status }: { status: TicketStatusEnum }) {
  const getActiveStepIndex = (st: TicketStatusEnum) => {
    if (['Closed', 'ClosedPendingRate', 'ClosedRejected', 'Incident'].includes(st)) return 5;
    if (st === 'Resolved') return 4;
    if (['InProgress', 'WaitingCustomer', 'WaitingParts', 'WaitingOnsiteSchedule'].includes(st)) return 3;
    if (st === 'Assigned') return 2;
    if (st === 'Escalated') return 3;
    return 0; // New or Open
  };

  const activeIndex = getActiveStepIndex(status);

  return (
    <View style={[styles.stepperContainer, Shadow]}>
      <Text style={styles.stepperTitle}>Tiến độ xử lý</Text>
      <View style={styles.stepperRow}>
        {STEP_CONFIGS.map((step, idx) => {
          const done = idx < activeIndex;
          const current = idx === activeIndex;
          const reached = idx <= activeIndex;
          const isLast = idx === STEP_CONFIGS.length - 1;

          return (
            <View key={step.key} style={styles.stepItemCol}>
              <View style={styles.circleRow}>
                <View
                  style={[
                    styles.stepLine,
                    idx === 0 ? styles.lineHidden : reached && styles.stepLineActive,
                  ]}
                />
                <View
                  style={[
                    styles.stepCircle,
                    done && styles.stepCircleDone,
                    current && styles.stepCircleCurrent,
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  ) : current ? (
                    <View style={styles.currentDot} />
                  ) : (
                    <View style={styles.inactiveInnerDot} />
                  )}
                </View>
                <View
                  style={[
                    styles.stepLine,
                    isLast ? styles.lineHidden : done && styles.stepLineActive,
                  ]}
                />
              </View>
              <Text style={[styles.stepLabel, reached && styles.stepLabelActive]} numberOfLines={1}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function TicketDetailScreen() {
  return (
    <PermissionGuard permission={P.TICKET_VIEW}>
      <TicketDetailScreenInner />
    </PermissionGuard>
  );
}

function TicketDetailScreenInner() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ticket, isLoading, isError, refetch } = useTicketDetail(id ?? '');
  const imageHeaders = useAuthImageHeaders();
  const accountId = useSessionStore((s) => s.user?.accountId);

  const { data: batteries = [] } = useMyBatteryAssets();
  const { mutateAsync: addComment,      isPending: isCommenting  } = useAddComment(id ?? '');
  const { mutateAsync: rateTicket,      isPending: isRating      } = useRateTicket(id ?? '');
  const { mutateAsync: reopenTicket,    isPending: isReopening   } = useReopenTicket(id ?? '');
  const { mutateAsync: uploadAttachment, isPending: isUploading  } = useUploadCommentAttachment();

  // GH-44 — comments qua GET phân trang (DESC newest-first) + activities standalone + realtime.
  const commentsQuery = useTicketChatsCursor(id);
  const activitiesQuery = useTicketActivities(id);
  const { isConnected, typingUsers, notifyTyping } = useTicketCommentsRealtime(id);
  const { mutate: updateChat, isPending: editChatPending } = useUpdateTicketChat(id ?? '');
  const { mutate: deleteChat, isPending: deleteChatPending } = useDeleteTicketChat(id ?? '');
  const { mutateAsync: bulkDeleteChats, isPending: bulkDeletePending } =
    useBulkDeleteTicketChats(id ?? '');
  const { mutate: markChatsRead } = useMarkTicketChatsRead(id ?? '');
  const { mutate: addReaction } = useAddReaction(id ?? '');
  const { mutate: removeReaction } = useRemoveReaction(id ?? '');
  const { mutateAsync: downloadAttachment } = useDownloadChatAttachment(id ?? '');
  const { data: unreadCount = 0 } = useTicketUnreadCount(id);
  const { mutateAsync: translateChat } = useTranslateTicketChat(id ?? '');
  const { mutateAsync: transcribeVoice, isPending: transcribing } = useTranscribeVoiceChat(id ?? '');
  const voiceRecorder = useVoiceRecorder();
  // Trung bình biên độ hiện tại — điều khiển quả cầu "thở" theo giọng nói trong VoiceRecordingModal.
  const voiceLevel =
    voiceRecorder.waveform.reduce((sum, v) => sum + v, 0) / voiceRecorder.waveform.length;

  const [commentText,     setCommentText]     = useState('');
  // Mention đã chọn trong tin đang soạn — BE nhận qua field `mentions`, KHÔNG parse '@' từ body.
  const [pickedMentions,  setPickedMentions]  = useState<ChatMentionInput[]>([]);
  const [commentError,    setCommentError]    = useState('');
  const [attachments,     setAttachments]     = useState<AttachmentForm[]>([]);
  // Chọn nhiều tin để xoá (DELETE /chats/bulk) — chỉ tin của chính mình.
  const [selectMode,      setSelectMode]      = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [showRateModal,   setShowRateModal]   = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [activeTab,       setActiveTab]       = useState<'info' | 'chat'>('info');
  const [viewingImage,    setViewingImage]    = useState<string | null>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#34C759" size="large" />
      </View>
    );
  }

  if (isError && !ticket) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={32} color={Colors.textFaint} />
        <Text style={styles.errorMsg}>Không thể tải ticket.</Text>
        <Pressable onPress={() => refetch()} style={[styles.retryBtn, ShadowPrimary]}>
          <Text style={styles.retryText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  if (!ticket) return null;

  const canRate   = ticket.status === 'ClosedPendingRate';
  const isResolved = ticket.status === 'Resolved';
  const isClosed  = ['Closed', 'ClosedRejected'].includes(ticket.status);
  const isWaiting = ticket.status === 'WaitingCustomer';

  // BE đã ẩn comment internal cho Customer; flatten các page (DESC newest-first).
  // Dedup theo id: offset-pagination + realtime prepend có thể trả trùng 1 comment ở ranh giới trang.
  const seenCommentIds = new Set<string>();
  const comments = (commentsQuery.data?.pages ?? [])
    .flatMap((p) => p?.items ?? [])
    .filter((c) => {
      if (c.isInternal || seenCommentIds.has(c.id)) return false;
      seenCommentIds.add(c.id);
      return true;
    });
  const activities = activitiesQuery.data ?? [];

  const battery = batteries.find((b: BatteryAssetDto) => b.id === ticket.batteryAssetId);

  // TicketAttachment whitelist: .jpg .jpeg .png .pdf .doc .docx
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const handlePickAttachment = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để đính kèm file.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // chỉ ảnh jpg/png
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!ALLOWED_MIME.includes(mimeType)) {
      Alert.alert('Định dạng không hỗ trợ', 'Chỉ chấp nhận ảnh JPG, PNG, PDF, DOC, DOCX.');
      return;
    }
    const name = asset.fileName ?? `attachment_${Date.now()}.jpg`;
    try {
      const uploaded = await uploadAttachment({ uri: asset.uri, name, type: mimeType });
      setAttachments((prev) => [...prev, uploaded]);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải file lên. Vui lòng thử lại.');
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedChatIds(new Set());
  };

  const handleBulkDelete = () => {
    const ids = [...selectedChatIds];
    if (ids.length === 0) return;
    Alert.alert(
      'Xóa tin nhắn',
      `Xóa ${ids.length} tin nhắn đã chọn? Không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const res = await bulkDeleteChats(ids);
                exitSelectMode();
                // BE partial success: id không tìm thấy / đã xoá trước đó rơi vào skipped.
                if (res && res.skipped > 0) {
                  Alert.alert('Đã xóa', `Đã xóa ${res.deleted} tin. ${res.skipped} tin không xóa được.`);
                }
              } catch {
                // handleErrorApi trong hook đã hiện toast/alert.
              }
            })();
          },
        },
      ],
    );
  };

  const handleRemoveAttachment = (fileId: string) => {
    setAttachments((prev) => prev.filter((a) => a.fileId !== fileId));
  };

  const handleSendComment = async () => {
    setCommentError('');
    // Không báo lỗi "để trống" — nút gửi đã disable khi rỗng. Chỉ chặn gửi tin hoàn toàn trống.
    const trimmed = commentText.trim();
    if (!trimmed && attachments.length === 0) return;
    try {
      // Chỉ gửi mention còn hiện diện trong body (user có thể đã xoá tên đi).
      const activeMentions = pickedMentions.filter((m) =>
        trimmed.includes(`@${m.displayName.replace(/\s+/g, '_')}`),
      );
      await addComment({
        body: trimmed,
        mentions: activeMentions.length > 0 ? activeMentions : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setCommentText('');
      setPickedMentions([]);
      setAttachments([]);
      // Realtime là nguồn chính: hub đẩy ChatAdded (BE gửi tới cả người gửi) → setQueryData prepend.
      // Chỉ fallback refetch khi hub không kết nối (WS bị chặn / chưa connect).
      if (!isConnected) commentsQuery.refetch();
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi bình luận. Vui lòng thử lại.');
    }
  };

  const handleMarkRead = (chatIds: string[]) => markChatsRead(chatIds);
  const handleTranslate = async (comment: { id: string }, targetLanguage: string) => {
    const res = await translateChat({ chatId: comment.id, targetLanguage });
    return res.data.data ?? undefined;
  };
  const handleStartRecording = async () => {
    try {
      await voiceRecorder.start();
    } catch {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập micro để ghi âm.');
    }
  };
  const handleStopRecording = async () => {
    const file = await voiceRecorder.stop();
    if (!file) return;
    try {
      await transcribeVoice(file);
    } catch {
      // handleErrorApi trong hook đã Alert lỗi — không cần xử lý thêm ở đây.
    }
  };

  const handleRate = async (data: RatePayload) => {
    try {
      await rateTicket(data);
      setShowRateModal(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
    }
  };

  const handleReopen = async (data: ReopenPayload) => {
    try {
      await reopenTicket(data);
      setShowReopenModal(false);
    } catch (err) {
      const msg = err instanceof HttpError && err.statusCode === 403
        ? 'Đã quá 7 ngày để mở lại ticket.'
        : 'Không thể mở lại ticket. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    }
  };

  const handleNavigateToBattery = () => {
    if (battery) {
      router.push({
        pathname: '/(customer)/batteries/[id]',
        params: { id: battery.id },
      });
    } else if (ticket.batteryAssetId) {
      router.push({
        pathname: '/(customer)/batteries/[id]',
        params: { id: ticket.batteryAssetId },
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior="padding"
      enabled={Platform.OS === 'ios'}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.topCode} numberOfLines={1}>{ticket.code}</Text>
        {/* Spacer giữ mã ticket ở giữa. Badge chưa đọc nằm trên tab "Trao đổi",
            không lặp lại ở đây để tránh 2 chỗ cùng báo một con số. */}
        <View style={styles.unreadSlot} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>Thông tin</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>Trao đổi</Text>
          {/* Số CHƯA ĐỌC, không phải tổng số tin. Ẩn khi đang mở chính tab này:
              tin mới về qua SignalR làm badge nháy lên trước khi thread kịp
              mark-read, mà user thì đang đọc ngay tin đó. */}
          {activeTab !== 'chat' && unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Info tab */}
      {activeTab === 'info' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Title card */}
          <View style={[styles.titleCard, Shadow]}>
            <View style={styles.badgeRow}>
              <PriorityBadge priority={ticket.priority} />
              <TicketStatusBadge status={ticket.status} />
            </View>
            <Text style={styles.title}>{ticket.title}</Text>
            {/* Trước đây ngày + danh mục dồn vào MỘT dòng xám chạy dài, mắt phải
                tự tách. Tách thành 2 mẩu có icon → quét nhanh hơn. */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={Colors.textMute} />
                <Text style={styles.metaText}>{fmtDateTime(ticket.createdAt)}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Ionicons name="pricetag-outline" size={12} color={Colors.textMute} />
                <Text style={styles.metaText}>
                  {CATEGORY_LABEL[ticket.category] ?? ticket.category}
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              {ticket.slaTimer && <SlaCountdown sla={ticket.slaTimer} />}
            </View>
          </View>

          {/* Stepper progress */}
          <HorizontalStepper status={ticket.status} />

          {/* Waiting customer response banner */}
          {isWaiting && (
            <View style={styles.waitBanner}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={styles.waitText}>Đang chờ phản hồi của bạn</Text>
            </View>
          )}

          {/* Battery / Device Link card */}
          <Pressable style={[styles.batteryLinkCard, Shadow]} onPress={handleNavigateToBattery}>
            <View style={[styles.batteryIconBg, { backgroundColor: '#E8F8EE' }]}>
              <Ionicons name="battery-charging" size={18} color="#34C759" />
            </View>
            <View style={styles.batteryLinkInfo}>
              {/* Trước đây khi chưa tải xong pin thì render đúng chữ "Thiết bị ..."
                  — trông như lỗi tràn chữ. Nói rõ đang tải / chưa liên kết. */}
              <Text style={styles.batteryLinkTitle} numberOfLines={1}>
                {battery
                  ? battery.batteryTypeName
                  : ticket.batteryAssetId
                    ? 'Đang tải thiết bị…'
                    : 'Chưa liên kết thiết bị'}
              </Text>
              <Text style={styles.batteryLinkSub} numberOfLines={1}>
                {battery
                  ? `${battery.serialNumber}${battery.siteName ? ` · ${battery.siteName}` : ''}`
                  : ticket.batteryAssetId
                    ? 'Chạm để xem chi tiết'
                    : 'Ticket không gắn với pin cụ thể'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
          </Pressable>

          {/* Assignment info row */}
          {(() => {
            const assignActivity = ticket.activities?.find((a) => a.action === 'StaffAssigned' || a.action === 'StaffReassigned');
            // #697 — trạng thái phân công suy ra từ `assignments`, không phải
            // `assignedStaffId` (BE đã bỏ field đó).
            const assignments = ticket.assignments ?? [];
            const hasPrimary = assignments.some((a) => a.role === 'PrimaryHandler');
            const supporterCount = assignments.filter((a) => a.role === 'Supporter').length;
            if (!hasPrimary && !assignActivity) return null;
            return (
              <View style={[styles.assignCard, Shadow]}>
                <View style={styles.assignRow}>
                  <View style={styles.assignIconWrap}>
                    <Ionicons name="person-outline" size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.assignInfo}>
                    <Text style={styles.assignLabel}>Kỹ thuật viên</Text>
                    <Text style={styles.assignValue}>
                      {hasPrimary ? 'Đã phân công' : 'Chưa phân công'}
                      {supporterCount > 0 && (
                        <Text style={styles.assignTime}>
                          {` · +${supporterCount} hỗ trợ`}
                        </Text>
                      )}
                    </Text>
                  </View>
                </View>
                {assignActivity && (
                  <View style={[styles.assignRow, { marginTop: 10 }]}>
                    <View style={styles.assignIconWrap}>
                      <Ionicons name="person-add-outline" size={16} color={Colors.textMute} />
                    </View>
                    <View style={styles.assignInfo}>
                      <Text style={styles.assignLabel}>Phân công bởi</Text>
                      <Text style={styles.assignValue}>
                        {assignActivity.actorDisplayName ?? assignActivity.actorRole}
                        <Text style={styles.assignTime}>
                          {' · '}{fmtDateTime(assignActivity.createdAt)}
                        </Text>
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Descriptions & resolution info */}
          {ticket.description ? (
            <View style={[styles.descCard, Shadow]}>
              <Text style={styles.sectionH}>Mô tả ban đầu</Text>
              <Text style={styles.descText}>{ticket.description}</Text>

              {/* Thời điểm phát hiện — Customer đã nhập khi tạo ticket. */}
              {ticket.detectedAt ? (
                <Text style={styles.detectedInfo}>
                  Phát hiện lúc:{' '}
                  {fmtDateTime(ticket.detectedAt)}
                </Text>
              ) : null}

              {/* Attachments — BE trả mảng FileId (string[]) */}
              {(ticket.attachmentFileIds?.length ?? 0) > 0 && (
                <>
                  <Text style={[styles.sectionH, { marginTop: 14, marginBottom: 8 }]}>Ảnh đính kèm</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachRow}>
                    {ticket.attachmentFileIds!.map((fileId, i) => (
                      <Pressable key={fileId ?? `att-${i}`} style={styles.attachCard} onPress={() => setViewingImage(fileId)}>
                        <AuthImage fileId={fileId} style={styles.attachImage} />
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          ) : null}

          {ticket.resolutionSummary ? (
            <View style={[styles.descCard, Shadow]}>
              <Text style={styles.sectionH}>Kết quả xử lý</Text>
              <Text style={styles.descText}>{ticket.resolutionSummary}</Text>
            </View>
          ) : null}

          {/* Resolved info banner */}
          {isResolved && (
            <View style={[styles.resolvedCard, Shadow]}>
              <Ionicons name="checkmark-circle" size={24} color="#2F7A2F" />
              <View style={{ flex: 1 }}>
                <Text style={styles.resolvedTitle}>Ticket đã được xử lý</Text>
                <Text style={styles.resolvedSub}>Vui lòng đánh giá để đóng ticket</Text>
              </View>
            </View>
          )}

          {/* Action card buttons */}
          {canRate && (
            <View style={[styles.actionCard, Shadow]}>
              <Pressable style={[styles.rateBtn, ShadowPrimary]} onPress={() => setShowRateModal(true)}>
                <Ionicons name="star" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Đánh giá ticket</Text>
              </Pressable>
              <Pressable style={styles.reopenLink} onPress={() => setShowReopenModal(true)}>
                <Text style={styles.reopenLinkText}>Yêu cầu mở lại ticket</Text>
              </Pressable>
            </View>
          )}

          {isClosed && (
            <View style={[styles.closedCard, Shadow]}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMute} />
              <Text style={styles.closedText}>Ticket đã được đóng hoàn toàn</Text>
            </View>
          )}

          {/* Historical activities timeline — GH-44: GET /activities standalone */}
          {activities.length > 0 && (
            <View style={[styles.timelineCard, Shadow]}>
              <Text style={styles.sectionH}>Lịch sử hoạt động</Text>
              <ActivityTimeline activities={activities} />
            </View>
          )}
        </ScrollView>
      )}

      {/* Chat tab — messenger style, FlatList inverted: mới nhất neo xuống đáy */}
      {activeTab === 'chat' && (
        <View style={styles.chatContainer}>
          {selectMode && (
            <ChatSelectionHeader count={selectedChatIds.size} onCancel={exitSelectMode} />
          )}
          <CommentThread
            comments={comments}
            currentUserId={accountId}
            imageHeaders={imageHeaders}
            onImagePress={setViewingImage}
            isLoading={commentsQuery.isLoading}
            hasNextPage={commentsQuery.hasNextPage}
            isFetchingNextPage={commentsQuery.isFetchingNextPage}
            onLoadMore={() => commentsQuery.fetchNextPage()}
            accentColor="#34C759"
            ticketClosed={isClosed}
            onEdit={(comment, body, editReason) =>
              updateChat({ chatId: comment.id, payload: { body, editReason } })
            }
            onDelete={(comment, reason) => deleteChat({ chatId: comment.id, reason })}
            selectMode={selectMode}
            selectedIds={selectedChatIds}
            onToggleSelect={(comment) =>
              setSelectedChatIds((prev) => {
                const next = new Set(prev);
                if (next.has(comment.id)) next.delete(comment.id);
                else next.add(comment.id);
                return next;
              })
            }
            onRequestSelectMode={(comment) => {
              setSelectMode(true);
              setSelectedChatIds(new Set([comment.id]));
            }}
            editPending={editChatPending}
            deletePending={deleteChatPending}
            onMarkRead={handleMarkRead}
            onTranslate={handleTranslate}
            onToggleReaction={(comment, type, isActive) =>
              isActive
                ? removeReaction({ chatId: comment.id, type })
                : addReaction({ chatId: comment.id, reactionType: type })
            }
            onDownloadAttachments={(comment, fileIds) => {
              // Tuần tự — tránh nhiều share sheet mở cùng lúc (share sheet thứ 2 bị nuốt).
              void (async () => {
                for (const fid of fileIds) {
                  try {
                    await downloadAttachment({ chatId: comment.id, fileId: fid, fileName: `tep-${fid.slice(0, 8)}` });
                  } catch (e) {
                    Alert.alert('Tải tệp', (e as Error).message);
                    break;
                  }
                }
              })();
            }}
          />

          {/* Selection mode: nút Xóa (N) thay cho toàn bộ khu vực soạn tin. */}
          {selectMode && (
            <ChatSelectionFooter
              count={selectedChatIds.size}
              pending={bulkDeletePending}
              onDelete={handleBulkDelete}
            />
          )}

          {/* Attachment chips */}
          {!selectMode && attachments.length > 0 && (
            <View style={styles.attachmentList}>
              {attachments.map((a) => (
                <View key={a.fileId} style={styles.attachmentChip}>
                  <Text style={styles.attachmentChipIcon}>📄</Text>
                  <Text style={styles.attachmentName} numberOfLines={1}>{a.fileName}</Text>
                  <Pressable onPress={() => handleRemoveAttachment(a.fileId)} hitSlop={10}>
                    <Text style={styles.attachmentRemove}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {!selectMode && commentError ? (
            <View style={styles.composerError}>
              <Text style={styles.fieldError}>{commentError}</Text>
            </View>
          ) : null}

          {!selectMode && (
            <>
          {/* Autocomplete Popup @Mention khi gõ @ */}
          <MentionSuggestionsPopup
            text={commentText}
            ticketId={id}
            onSelectMention={(target) => {
              const newText = commentText.replace(/@([a-zA-Z0-9_.-]*)$/, `${target.tag} `);
              setCommentText(newText);
              setPickedMentions((prev) =>
                prev.some((m) => m.userId === target.id)
                  ? prev
                  : [...prev, { userId: target.id, displayName: target.displayName }],
              );
            }}
          />

          {/* "Đang nhập" — ngay trên ô input, nền transparent */}
          <TypingIndicator names={typingUsers.map((u) => u.displayName)} />

          {/* Composer bar */}
          <View
            style={[
              styles.composer,
              {
                paddingBottom: keyboardHeight > 0
                  ? keyboardHeight + 12
                  : (insets.bottom > 0 ? insets.bottom + 8 : 12)
              }
            ]}
          >
            <Pressable style={styles.composerIcon} onPress={handlePickAttachment} disabled={isUploading}>
              {isUploading
                ? <ActivityIndicator size="small" color={Colors.textMute} />
                : <Ionicons name="camera-outline" size={24} color={Colors.textMute} />}
            </Pressable>
            <TextInput
              style={styles.composerInput}
              value={commentText}
              onChangeText={(t) => { setCommentText(t); setCommentError(''); notifyTyping(); }}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={Colors.textFaint}
              multiline
              maxLength={1000}
            />
            <Pressable
              style={styles.composerIcon}
              onPress={handleStartRecording}
              disabled={isUploading || transcribing}
            >
              {transcribing
                ? <ActivityIndicator size="small" color={Colors.textMute} />
                : <Ionicons name="mic-outline" size={22} color={Colors.textMute} />}
            </Pressable>
            <Pressable
              style={[styles.sendBtn, ((!commentText.trim() && attachments.length === 0) || isCommenting) && styles.btnDisabled]}
              onPress={handleSendComment}
              disabled={(!commentText.trim() && attachments.length === 0) || isCommenting}
            >
              {isCommenting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="send" size={18} color="#fff" />}
            </Pressable>
          </View>
            </>
          )}
        </View>
      )}

      <VoiceRecordingModal
        visible={voiceRecorder.isRecording}
        elapsedSeconds={voiceRecorder.elapsedSeconds}
        level={voiceLevel}
        transcribing={transcribing}
        onStop={handleStopRecording}
        onCancel={voiceRecorder.cancel}
      />

      <RateModal visible={showRateModal} isLoading={isRating} onClose={() => setShowRateModal(false)} onSubmit={handleRate} />
      <ReopenModal visible={showReopenModal} isLoading={isReopening} onClose={() => setShowReopenModal(false)} onSubmit={handleReopen} />

      {/* Fullscreen image viewer */}
      {viewingImage !== null && (
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setViewingImage(null)}
        >
          <View style={styles.imgOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setViewingImage(null)} />
            <AuthImage fileId={viewingImage} style={styles.imgFull} resizeMode="contain" />
            <Pressable
              style={[styles.imgCloseBtn, { top: insets.top + 12 }]}
              onPress={() => setViewingImage(null)}
              hitSlop={12}
            >
              <Ionicons name="close-circle" size={38} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, gap: 10 },
  errorMsg:       { color: Colors.textMute, fontSize: 14, marginTop: 4 },
  retryBtn:       { backgroundColor: '#34C759', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  retryText:      { color: '#fff', fontWeight: '800', fontSize: 14 },

  topBar:         {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  backBtn:        {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
  },
  topCode:        { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', color: Colors.text },
  unreadSlot:     { width: 42, alignItems: 'flex-end', justifyContent: 'center' },
  unreadBadge:    {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primary, borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  unreadText:     { color: '#FFF', fontSize: 11, fontWeight: '800' },
  moreBtn:        {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#34C759',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMute,
  },
  tabTextActive: {
    color: '#34C759',
    fontWeight: '800',
  },
  tabBadge: {
    backgroundColor: Colors.danger, // đỏ = chưa đọc, thống nhất với web

    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  chatContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  scroll:         { padding: 16, gap: 12, paddingBottom: 40 },

  titleCard:      { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  badgeRow:       { flexDirection: 'row', gap: 8 },
  badge:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeDot:       { width: 6, height: 6, borderRadius: 3 },
  badgeLabel:     { fontSize: 11, fontWeight: '700' },
  title:          { fontSize: 18, fontWeight: '800', color: Colors.text, lineHeight: 26, letterSpacing: -0.3 },
  metaRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaDivider:    { width: 1, height: 10, backgroundColor: 'rgba(0,0,0,0.10)' },
  metaText:       { fontSize: 11.5, color: Colors.textMute, fontWeight: '600' },

  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  stepperTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepItemCol: {
    flex: 1,
    alignItems: 'center',
  },
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stepLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#EDECE8',
  },
  stepLineActive: {
    backgroundColor: '#34C759',
  },
  lineHidden: {
    backgroundColor: 'transparent',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EDECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: {
    backgroundColor: '#34C759',
  },
  stepCircleCurrent: {
    backgroundColor: '#34C759',
    borderWidth: 3,
    borderColor: '#C6EFD3',
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  inactiveInnerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#C9C7BF',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMute,
    marginTop: 6,
    textAlign: 'center',
  },
  stepLabelActive: {
    fontWeight: '800',
    color: '#34C759',
  },

  waitBanner:     {
    backgroundColor: Colors.stWaiting, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12,
  },
  waitText:       { color: '#fff', fontSize: 13, fontWeight: '700' },

  batteryLinkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  batteryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  batteryLinkInfo: {
    flex: 1,
  },
  batteryLinkTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  batteryLinkSub: {
    fontSize: 11,
    color: Colors.textMute,
    marginTop: 3,
    fontWeight: '600',
  },

  assignCard:     { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  assignRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  assignIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#E8F8EE', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  assignInfo:     { flex: 1 },
  assignLabel:    { fontSize: 11, color: Colors.textMute, fontWeight: '500', marginBottom: 2 },
  assignValue:    { fontSize: 13, color: Colors.text, fontWeight: '700' },
  assignTime:     { fontSize: 11, color: Colors.textMute, fontWeight: '400' },
  descCard:       { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  sectionH:       { fontSize: 13, fontWeight: '800', color: Colors.text, letterSpacing: -0.1 },
  descText:       { fontSize: 13, color: Colors.text2, lineHeight: 22, fontWeight: '500' },
  detectedInfo:   { fontSize: 12, color: Colors.textMute, marginTop: 10, fontWeight: '600' },
  attachRow:      { gap: 8 },
  attachCard:     {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  attachImage:    {
    width: '100%',
    height: '100%',
  },

  resolvedCard:   {
    backgroundColor: '#E8F5E9', borderRadius: 16,
    padding: 16, alignItems: 'center', flexDirection: 'row', gap: 12,
  },
  resolvedTitle:  { fontSize: 14, fontWeight: '800', color: '#2F7A2F' },
  resolvedSub:    { fontSize: 11, color: '#2F7A2F', opacity: 0.8, marginTop: 2 },

  actionCard:     { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  rateBtn:        {
    backgroundColor: '#34C759', borderRadius: 16,
    padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  actionBtnText:  { color: '#fff', fontWeight: '800', fontSize: 14 },
  reopenLink:     { alignItems: 'center' },
  reopenLinkText: { color: '#34C759', fontSize: 13, fontWeight: '700' },

  closedCard:     {
    backgroundColor: Colors.card2, borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  closedText:     { fontSize: 13, fontWeight: '700', color: Colors.textMute },

  timelineCard:   { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },

  composer:       {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)',
  },
  composerIcon:   { padding: 8 },
  composerInput:  {
    flex: 1, backgroundColor: Colors.card2, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: Colors.text,
    maxHeight: 120,
  },
  sendBtn:        {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#34C759',
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled:    { opacity: 0.35 },
  composerError:  { backgroundColor: '#FFFFFF', paddingHorizontal: 18 },
  fieldError:     { color: Colors.danger, fontSize: 12 },

  attachmentList:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingTop: 8, backgroundColor: '#FFFFFF' },
  attachmentChip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card2, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 5, maxWidth: 200 },
  attachmentChipIcon: { fontSize: 12 },
  attachmentName:     { flex: 1, fontSize: 12, color: Colors.text, fontWeight: '500' },
  attachmentRemove:   { fontSize: 12, color: Colors.textMute, fontWeight: '700', marginLeft: 2 },

  imgOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', alignItems: 'center', justifyContent: 'center' },
  imgFull:     { width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.78 },
  imgCloseBtn: { position: 'absolute', right: 16 },
});
