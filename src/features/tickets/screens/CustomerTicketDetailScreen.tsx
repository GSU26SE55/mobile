import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HttpError } from '@/src/lib/errors';
import { P } from '@/src/lib/authz';
import { PermissionGuard } from '@/src/features/auth/components/PermissionGuard';
import { ActivityTimeline } from '@/src/features/tickets/components/ActivityTimeline';
import { CommentThread } from '@/src/features/tickets/components/CommentThread';
import { isWhitespaceOrEmojiOnly } from '@/src/shared/schemas/common.schema';
import {
  ChatSelectionHeader,
  ChatSelectionFooter,
} from '@/src/features/tickets/components/ChatSelectionBar';
import { RateModal } from '@/src/features/tickets/components/RateModal';
import { ReopenModal } from '@/src/features/tickets/components/ReopenModal';
import { SlaCountdown } from '@/src/features/tickets/components/SlaCountdown';
import { TicketStatusBadge } from '@/src/features/tickets/components/TicketStatusBadge';
import { useChatSender } from '@/src/features/tickets/hooks/useChatSender';
import { ticketService } from '@/src/features/tickets/services/ticket.service';
import { useRateTicket } from '@/src/features/tickets/hooks/useRateTicket';
import { useReopenTicket } from '@/src/features/tickets/hooks/useReopenTicket';
import { useUploadCommentAttachment } from '@/src/features/tickets/hooks/useUploadCommentAttachment';
import { useTicketDetail } from '@/src/features/tickets/hooks/useTicketDetail';
import { MentionSuggestionsPopup } from '@/src/features/tickets/components/MentionSuggestionsPopup';
import { useTicketChatsCursor } from '@/src/features/tickets/hooks/useTicketChatsCursor';
import { useAddReaction, useRemoveReaction } from '@/src/features/tickets/hooks/useChatReactions';
import { useDownloadChatAttachment } from '@/src/features/tickets/hooks/useDownloadChatAttachment';
import { useTicketUnreadCount } from '@/src/features/tickets/hooks/useTicketUnreadCount';
import { useTicketActivities } from '@/src/features/tickets/hooks/useTicketActivities';
import { useTicketCommentsRealtime } from '@/src/features/tickets/hooks/useTicketCommentsRealtime';
import {
  useUpdateTicketChat,
  useDeleteTicketChat,
  useBulkDeleteTicketChats,
  useMarkTicketChatsRead,
  useTranslateTicketChat,
  useTranscribeVoiceChat,
} from '@/src/features/tickets/hooks/useTicketChatActions';
import { useVoiceRecorder } from '@/src/features/tickets/hooks/useVoiceRecorder';
import { VoiceRecordingModal } from '@/src/features/tickets/components/VoiceRecordingModal';
import { TypingIndicator } from '@/src/features/tickets/components/TypingIndicator';
import { useAuthImageHeaders } from '@/src/features/file-storage/hooks/useAuthImageHeaders';
import { AuthImage } from '@/src/features/file-storage/components/AuthImage';
import { AttachmentForm } from '@/src/features/tickets/schemas/comment.schema';
import {
  RatePayload,
  ReopenPayload,
  type ChatMentionInput,
  type TicketPriorityEnum,
} from '@/src/features/tickets/types/ticket.types';
import { priorityMeta } from '@/src/features/tickets/utils/ticketLabels';
import { canRateOrReopen, isTerminalTicket, isTicketChatLocked, shouldShowLiveSla } from '@/src/features/tickets/utils/ticketWorkflow';
import { PendingContextCard } from '@/src/features/tickets/components/PendingContextCard';
import { formatDateTime } from '@/src/lib/date';
import { Colors, Shadow, ShadowPrimary } from '@/src/lib/theme';
import { useMyBatteryAssets } from '@/src/features/batteries/hooks/useMyBatteryAssets';
import { BatteryAssetDto } from '@/src/features/batteries/types/battery.types';
import { useSessionStore } from '@/src/stores/sessionStore';
import { getPrimaryHandlerName, getSupporterNames } from '@/src/features/tickets/utils/assignments';
import { BackButton } from '@/src/shared/components/ScreenHeader';
import EnvironmentalIncidentCard from '@/src/features/tickets/components/EnvironmentalIncidentCard';

function PriorityBadge({ priority }: { priority: TicketPriorityEnum | null }) {
  // priority null khi ticket chưa triage — priorityMeta trả nhãn trung tính, không nhầm P3.
  const meta = priorityMeta(priority);
  return (
    <View style={[styles.badge, { backgroundColor: meta.chipBg }]}>
      <View style={[styles.badgeDot, { backgroundColor: meta.chipText }]} />
      <Text style={[styles.badgeLabel, { color: meta.chipText }]}>{meta.short}</Text>
    </View>
  );
}

export function CustomerTicketDetailScreen() {
  return (
    <PermissionGuard permission={P.TICKET_VIEW}>
      <TicketDetailScreenInner />
    </PermissionGuard>
  );
}

function TicketDetailScreenInner() {
  const insets = useSafeAreaInsets();
  const { height: keyboardHeightSV, progress: keyboardProgressSV } = useReanimatedKeyboardAnimation();

  const chatContainerAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.abs(keyboardHeightSV.value),
  }));

  const composerAnimatedStyle = useAnimatedStyle(() => {
    const closedPadding = insets.bottom > 0 ? insets.bottom + 4 : 10;
    const openPadding = 10;
    const currentPadding = interpolate(
      keyboardProgressSV.value,
      [0, 1],
      [closedPadding, openPadding],
    );
    return {
      paddingBottom: currentPadding,
    };
  });

  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { data: ticket, isLoading, isError, refetch } = useTicketDetail(id ?? '');
  const imageHeaders = useAuthImageHeaders();
  const accountId = useSessionStore((s) => s.user?.accountId);

  const { data: batteries = [] } = useMyBatteryAssets();
  // Outbox — enqueue() doesn't await the BE, the worker sends sequentially with backoff retry.
  const { pending: pendingChats, enqueue: enqueueComment, retry: retryPendingComment, discard: discardPendingComment } =
    useChatSender(id ?? '', (ticketId, payload) =>
      ticketService.addComment(ticketId, { ...payload, isInternal: false }),
    );
  const { mutateAsync: rateTicket,      isPending: isRating      } = useRateTicket(id ?? '');
  const { mutateAsync: reopenTicket,    isPending: isReopening   } = useReopenTicket(id ?? '');
  const { mutateAsync: uploadAttachment, isPending: isUploading  } = useUploadCommentAttachment();

  // GH-44 — comments qua GET phân trang (DESC newest-first) + activities standalone + realtime.
  const commentsQuery = useTicketChatsCursor(id);
  const activitiesQuery = useTicketActivities(id, ticket?.status);
  const { typingUsers, notifyTyping } = useTicketCommentsRealtime(id);
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
  const composerRef = useRef<TextInput>(null);
  // Mention đã chọn trong tin đang soạn — BE nhận qua field `mentions`, KHÔNG parse '@' từ body.
  const [pickedMentions,  setPickedMentions]  = useState<ChatMentionInput[]>([]);
  const [attachments,     setAttachments]     = useState<AttachmentForm[]>([]);
  // Chọn nhiều tin để xoá (DELETE /chats/bulk) — chỉ tin của chính mình.
  const [selectMode,      setSelectMode]      = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [showRateModal,   setShowRateModal]   = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [activeTab,       setActiveTab]       = useState<'info' | 'chat'>(tab === 'chat' ? 'chat' : 'info');
  const [viewingImage,    setViewingImage]    = useState<string | null>(null);

  // Deep-link từ push notification: ?tab=chat mở thẳng tab chat. Cần useEffect
  // riêng vì màn đã mount sẵn thì đổi param KHÔNG chạy lại useState initializer.
  useEffect(() => {
    if (tab === 'chat') setActiveTab('chat');
  }, [tab]);

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
        <Text style={styles.errorMsg}>Failed to load ticket.</Text>
        <Pressable onPress={() => refetch()} style={[styles.retryBtn, ShadowPrimary]}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!ticket) return null;

  const canRate = canRateOrReopen(ticket);
  const isResolved = ticket.status === 'Completed';
  const isClosed = isTerminalTicket(ticket.status);
  // Chat khoá khi ticket đã xong việc — rộng hơn isClosed vì tính cả Completed, vốn nằm
  // trong ACTIVE_TICKET_STATUSES (ticket vẫn "sống" chờ Manager duyệt, nhưng phần trao đổi
  // thì đã chốt). Khớp với web: Completed/Closed/ClosedRejected đều read-only.
  const chatLocked = isTicketChatLocked(ticket.status);
  const isWaiting = ticket.status === 'Pending' && ticket.pendingContext === 'Held';

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
      Alert.alert('Access Permission', 'Photo library permission is required to attach files.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // chỉ ảnh jpg/png
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!ALLOWED_MIME.includes(mimeType)) {
      Alert.alert('Unsupported Format', 'Only JPG, PNG, PDF, DOC, and DOCX files are accepted.');
      return;
    }
    const name = asset.fileName ?? `attachment_${Date.now()}.jpg`;
    try {
      const uploaded = await uploadAttachment({ uri: asset.uri, name, type: mimeType });
      setAttachments((prev) => [...prev, uploaded]);
    } catch {
      Alert.alert('Error', 'Failed to upload file. Please try again.');
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
      'Delete Messages',
      `Delete ${ids.length} selected message(s)? They are removed from the conversation and you can't undo this yourself.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const res = await bulkDeleteChats(ids);
                exitSelectMode();
                // BE partial success: id không tìm thấy / đã xoá trước đó rơi vào skipped.
                if (res && res.skipped > 0) {
                  Alert.alert('Deleted', `Deleted ${res.deleted} message(s). ${res.skipped} message(s) could not be deleted.`);
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

  // BE (ChatBodyPolicy) từ chối body chỉ có khoảng trắng/emoji. Không chặn ở đây thì tin
  // vào outbox rồi mới hỏng — người dùng thấy bubble lỗi thay vì nút gửi mờ đi.
  const commentBodyIsSendable =
    commentText.trim().length > 0 && !isWhitespaceOrEmojiOnly(commentText);
  const canSendComment = commentBodyIsSendable || attachments.length > 0;

  const handleSendComment = () => {
    // Không báo lỗi "để trống" — nút gửi đã disable khi rỗng. Chỉ chặn gửi tin hoàn toàn trống.
    const trimmed = commentText.trim();
    if (!canSendComment) return;
    // Chỉ gửi mention còn hiện diện trong body (user có thể đã xoá tên đi).
    const activeMentions = pickedMentions.filter((m) =>
      trimmed.includes(`@${m.displayName.replace(/\s+/g, '_')}`),
    );
    // Outbox — không await BE. Bubble optimistic hiện ngay; lỗi (nếu có) hiện trên chính
    // bubble đó qua PendingBubble (retry/discard), không chặn composer.
    void enqueueComment({
      body: trimmed,
      isInternal: false,
      mentions: activeMentions.length > 0 ? activeMentions : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    setCommentText('');
    setPickedMentions([]);
    setAttachments([]);
    // Tapping the send button blurs the input, so without this the user has to tap back into
    // the composer before every message. Keep the keyboard up and carry on typing.
    composerRef.current?.focus();
  };

  const handleMarkRead = (chatIds: string[], onFailed: () => void) =>
    markChatsRead({ chatIds, onFailed });
  const handleTranslate = async (comment: { id: string }, targetLanguage: string) => {
    const res = await translateChat({ chatId: comment.id, targetLanguage });
    return res.data.data ?? undefined;
  };
  const handleStartRecording = async () => {
    try {
      await voiceRecorder.start();
    } catch {
      Alert.alert('Access Permission', 'Microphone permission is required to record audio.');
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
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  };

  const handleReopen = async (data: ReopenPayload) => {
    try {
      await reopenTicket(data);
      setShowReopenModal(false);
    } catch (err) {
      const msg = err instanceof HttpError && err.statusCode === 403
        ? 'More than 7 days have passed, cannot reopen ticket.'
        : 'Failed to reopen ticket. Please try again.';
      Alert.alert('Error', msg);
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
    <View style={styles.root}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <BackButton />
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
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>Information</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>Chat</Text>
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
              <TicketStatusBadge status={ticket.status} audience="customer" />
            </View>
            {/* Đã bỏ ngày tạo + danh mục. Đếm ngược SLA giữ lại, đặt cùng kiểu
                với màn Staff: một dòng riêng dưới tiêu đề. */}
            <Text style={styles.title}>{ticket.title}</Text>
          {ticket.slaTimer && shouldShowLiveSla(ticket.status, ticket.priority, ticket.slaTimer.status) && <SlaCountdown sla={ticket.slaTimer} />}
          </View>

          <PendingContextCard ticket={ticket} />

          {/* Waiting customer response banner */}
          {isWaiting && (
            <View style={styles.waitBanner}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={styles.waitText}>Awaiting your response</Text>
            </View>
          )}

          {/* Site-level ticket → incident card instead of the battery card. Checked first because
              "no battery" is the correct shape here, not missing data, and the battery card says
              the opposite ("No device linked"). */}
          {ticket.environmentalIncidentId ? (
            <EnvironmentalIncidentCard
              incidentId={ticket.environmentalIncidentId}
              description={ticket.description}
            />
          ) : (
          /* Battery / Device Link card */
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
                    ? 'Loading device...'
                    : 'No device linked'}
              </Text>
              <Text style={styles.batteryLinkSub} numberOfLines={1}>
                {battery
                  ? `${battery.serialNumber}${battery.siteName ? ` · ${battery.siteName}` : ''}`
                  : ticket.batteryAssetId
                    ? 'Tap to view details'
                    : 'Ticket not linked to a specific battery'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
          </Pressable>
          )}

          {/* Assignment info row */}
          {(() => {
            const assignActivity = ticket.activities?.find((a) => a.action === 'StaffAssigned' || a.action === 'StaffReassigned');
            // #697 — trạng thái phân công suy ra từ `assignments`, không phải
            // `assignedStaffId` (BE đã bỏ field đó).
            const assignments = ticket.assignments ?? [];
            // BE trả kèm staffName nên hiện được TÊN thật thay vì "Đã phân công".
            const primaryName = getPrimaryHandlerName(assignments);
            const supporterNames = getSupporterNames(assignments);
            if (!primaryName && !assignActivity) return null;
            return (
              <View style={[styles.assignCard, Shadow]}>
                <View style={styles.assignRow}>
                  <View style={styles.assignIconWrap}>
                    <Ionicons name="person-outline" size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.assignInfo}>
                    <Text style={styles.assignLabel}>
                      Technicians
                      {/* >1 người thì nói rõ tổng số ngay ở nhãn; danh sách tên nằm ngay dưới. */}
                      {supporterNames.length > 0 &&
                        ` · ${supporterNames.length + (primaryName ? 1 : 0)} assignees`}
                    </Text>
                    <Text style={styles.assignValue}>
                      {primaryName ?? 'Unassigned'}
                      {primaryName && supporterNames.length > 0 && (
                        <Text style={styles.assignTime}> · primary handler</Text>
                      )}
                    </Text>
                    {/* Mỗi supporter một dòng — nối bằng dấu phẩy thì tên dài bị cắt cụt. */}
                    {supporterNames.map((name) => (
                      <Text key={name} style={styles.assignSupporter} numberOfLines={1}>
                        {name}
                        <Text style={styles.assignTime}> · support</Text>
                      </Text>
                    ))}
                  </View>
                </View>
                {assignActivity && (
                  <View style={[styles.assignRow, { marginTop: 10 }]}>
                    <View style={styles.assignIconWrap}>
                      <Ionicons name="person-add-outline" size={16} color={Colors.textMute} />
                    </View>
                    <View style={styles.assignInfo}>
                      <Text style={styles.assignLabel}>Assigned by</Text>
                      <Text style={styles.assignValue}>
                        {assignActivity.actorDisplayName ?? assignActivity.actorRole}
                        <Text style={styles.assignTime}>
                          {' · '}{formatDateTime(assignActivity.createdAt)}
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
              <Text style={styles.sectionH}>Initial description</Text>
              <Text style={styles.descText}>{ticket.description}</Text>

              {/* Thời điểm phát hiện — Customer đã nhập khi tạo ticket. */}
              {ticket.detectedAt ? (
                <Text style={styles.detectedInfo}>
                  Detected at:{' '}
                  {formatDateTime(ticket.detectedAt)}
                </Text>
              ) : null}

              {/* Attachments — BE trả mảng FileId (string[]) */}
              {(ticket.attachmentFileIds?.length ?? 0) > 0 && (
                <>
                  <Text style={[styles.sectionH, { marginTop: 14, marginBottom: 8 }]}>Attached images</Text>
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
              <Text style={styles.sectionH}>Resolution details</Text>
              <Text style={styles.descText}>{ticket.resolutionSummary}</Text>
            </View>
          ) : null}

          {/* Resolved info banner */}
          {isResolved && (
            <View style={[styles.resolvedCard, Shadow]}>
              <Ionicons name="checkmark-circle" size={24} color="#2F7A2F" />
              <View style={{ flex: 1 }}>
                <Text style={styles.resolvedTitle}>Work completed — awaiting Manager review</Text>
                <Text style={styles.resolvedSub}>A Manager will review the completed work.</Text>
              </View>
            </View>
          )}

          {/* Action card buttons */}
          {canRate && (
            <View style={[styles.actionCard, Shadow]}>
              <Pressable style={[styles.rateBtn, ShadowPrimary]} onPress={() => setShowRateModal(true)}>
                <Ionicons name="star" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Rate ticket</Text>
              </Pressable>
              <Pressable style={styles.reopenLink} onPress={() => setShowReopenModal(true)}>
                <Text style={styles.reopenLinkText}>Request to reopen ticket</Text>
              </Pressable>
            </View>
          )}

          {isClosed && !canRate && (
            <View style={[styles.closedCard, Shadow]}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMute} />
              <Text style={styles.closedText}>Ticket has been closed completely</Text>
            </View>
          )}

          {/* Historical activities timeline — GH-44: GET /activities standalone */}
          {activities.length > 0 && (
            <View style={[styles.timelineCard, Shadow]}>
              <Text style={styles.sectionH}>Activity history</Text>
              <ActivityTimeline activities={activities} assignments={ticket.assignments} />
            </View>
          )}
        </ScrollView>
      )}

      {/* Chat tab — messenger style, FlatList inverted: mới nhất neo xuống đáy */}
      {activeTab === 'chat' && (
        <Animated.View style={[styles.chatContainer, chatContainerAnimatedStyle]}>
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
            ticketClosed={chatLocked}
            pendingMessages={pendingChats}
            onRetryPending={retryPendingComment}
            onDiscardPending={discardPendingComment}
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
                    Alert.alert('Download File', (e as Error).message);
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

          {/* Ticket đã xong → thay toàn bộ khu soạn tin bằng dòng thông báo read-only. */}
          {chatLocked && !selectMode && (
            <View style={[styles.chatLockedBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 12 }]}>
              <Ionicons name="lock-closed-outline" size={15} color={Colors.textMute} />
              <Text style={styles.chatLockedText}>
                Ticket has been closed — chat is read-only
              </Text>
            </View>
          )}

          {/* Attachment chips */}
          {!chatLocked && !selectMode && attachments.length > 0 && (
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

          {!chatLocked && !selectMode && (
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
          <Animated.View
            style={[
              styles.composer,
              composerAnimatedStyle,
            ]}
          >
            <Pressable style={styles.composerIcon} onPress={handlePickAttachment} disabled={isUploading}>
              {isUploading
                ? <ActivityIndicator size="small" color={Colors.textMute} />
                : <Ionicons name="camera-outline" size={24} color={Colors.textMute} />}
            </Pressable>
            <TextInput
              ref={composerRef}
              style={styles.composerInput}
              value={commentText}
              onChangeText={(t) => { setCommentText(t); notifyTyping(); }}
              placeholder="Type a message..."
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
              style={[styles.sendBtn, !canSendComment && styles.btnDisabled]}
              onPress={handleSendComment}
              disabled={!canSendComment}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </Animated.View>
            </>
          )}
        </Animated.View>
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
    </View>
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
  assignSupporter:{ fontSize: 12, color: Colors.text, fontWeight: '600', marginTop: 2 },
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

  chatLockedBar:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 14, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: Colors.card2,
  },
  chatLockedText: { fontSize: 12.5, fontWeight: '600', color: Colors.textMute },

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
