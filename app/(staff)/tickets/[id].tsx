import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
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
import { BadgeColors, Colors, Shadow, ShadowPrimary } from '../../../src/lib/theme';
import { ActivityTimeline } from '../../../src/features/tickets/components/ActivityTimeline';
import { TypingIndicator } from '../../../src/features/tickets/components/TypingIndicator';
import { SlaCountdown } from '../../../src/features/tickets/components/SlaCountdown';
import { TicketStatusBadge } from '../../../src/features/tickets/components/TicketStatusBadge';
import { TicketActionBar } from '../../../src/features/staff/components/TicketActionBar';
import { HoldModal } from '../../../src/features/staff/components/HoldModal';
import { ResolveModal } from '../../../src/features/staff/components/ResolveModal';
import { EscalateModal } from '../../../src/features/staff/components/EscalateModal';
import { MaintenanceLogForm } from '../../../src/features/staff/components/MaintenanceLogForm';
import { useStaffTicketDetail } from '../../../src/features/staff/hooks/useStaffTicketDetail';
import { useStartTicket } from '../../../src/features/staff/hooks/useStartTicket';
import { useHoldTicket } from '../../../src/features/staff/hooks/useHoldTicket';
import { useResumeTicket } from '../../../src/features/staff/hooks/useResumeTicket';
import { useResolveTicket } from '../../../src/features/staff/hooks/useResolveTicket';
import { useEscalateTicket } from '../../../src/features/staff/hooks/useEscalateTicket';
import { useStaffAddComment } from '../../../src/features/staff/hooks/useStaffAddComment';
import { useAddMaintenanceLog } from '../../../src/features/staff/hooks/useAddMaintenanceLog';
import { useUpdateMaintenanceLog } from '../../../src/features/staff/hooks/useUpdateMaintenanceLog';
import { useUploadCommentAttachment } from '../../../src/features/tickets/hooks/useUploadCommentAttachment';
import { useTicketChatsCursor } from '../../../src/features/tickets/hooks/useTicketChatsCursor';
import { useAddReaction, useRemoveReaction } from '../../../src/features/tickets/hooks/useChatReactions';
import { useDownloadChatAttachment } from '../../../src/features/tickets/hooks/useDownloadChatAttachment';
import { useTicketUnreadCount } from '../../../src/features/tickets/hooks/useTicketUnreadCount';
import { useTicketActivities } from '../../../src/features/tickets/hooks/useTicketActivities';
import { useTicketCommentsRealtime } from '../../../src/features/tickets/hooks/useTicketCommentsRealtime';
import {
  useUpdateTicketChat,
  useDeleteTicketChat,
  useMarkTicketChatsRead,
  useTranslateTicketChat,
  useTranscribeVoiceChat,
  usePinChat,
  useUnpinChat,
} from '../../../src/features/tickets/hooks/useTicketChatActions';
import { useVoiceRecorder } from '../../../src/features/tickets/hooks/useVoiceRecorder';
import { useAuthImageHeaders } from '../../../src/features/file-storage/hooks/useAuthImageHeaders';
import { AuthImage } from '../../../src/features/file-storage/components/AuthImage';
import { CommentThread, ChatTab } from '../../../src/features/tickets/components/CommentThread';
import { ChatAiToolbar } from '../../../src/features/tickets/components/ChatAiToolbar';
import { VoiceRecordingModal } from '../../../src/features/tickets/components/VoiceRecordingModal';
import { ProcessingDurationTimer } from '../../../src/features/staff/components/ProcessingDurationTimer';
import { AttachmentForm } from '../../../src/features/tickets/schemas/comment.schema';
import { MaintenanceLogPayload, UpdateMaintenanceLogPayload } from '../../../src/features/staff/types/staff.types';
import { EscalationReasonEnum, PauseReasonEnum, TicketStatusEnum, MaintenanceLogDTO } from '../../../src/features/tickets/types/ticket.types';
import { AttachmentPicker, UploadedAttachment } from '../../../src/features/file-storage/components/AttachmentPicker';
import { AttachmentPreviewStrip } from '../../../src/features/file-storage/components/AttachmentPreviewStrip';
import { AttachmentThumbnails } from '../../../src/features/file-storage/components/AttachmentThumbnails';
import { FilePurposeEnum } from '../../../src/features/file-storage/enums/file-storage.enum';
import { useSessionStore } from '../../../src/stores/sessionStore';
import { checkPermission, P } from '../../../src/lib/authz';
import { PermissionGuard } from '../../../src/features/auth/components/PermissionGuard';
import { useTicketKbRefs } from '../../../src/features/kb/hooks/useTicketKbRefs';
import { useRemoveKbRef } from '../../../src/features/kb/hooks/useRemoveKbRef';
import { KbReferencePicker } from '../../../src/features/staff/components/KbReferencePicker';

type TabKey = 'comments' | 'activities' | 'logs' | 'kb';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'comments',   label: 'Trao đổi',  icon: 'chatbubbles-outline' },
  { key: 'activities', label: 'Lịch sử',   icon: 'time-outline' },
  { key: 'logs',       label: 'Nhật ký',    icon: 'document-text-outline' },
  { key: 'kb',         label: 'Bài KB',     icon: 'book-outline' },
];

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  P1Critical: { bg: BadgeColors.p1.bg, text: BadgeColors.p1.text },
  P2High:     { bg: BadgeColors.p2.bg, text: BadgeColors.p2.text },
  P3Normal:   { bg: BadgeColors.p3.bg, text: BadgeColors.p3.text },
};

const PRIORITY_LABELS: Record<string, string> = {
  P1Critical: 'P1 Critical',
  P2High:     'P2 High',
  P3Normal:   'P3 Normal',
};

function TabsRow({ activeTab, onChange }: { activeTab: TabKey; onChange: (key: TabKey) => void }) {
  return (
    <View style={styles.tabRow}>
      {TABS.map((tab) => (
        <Pressable
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          onPress={() => onChange(tab.key)}
        >
          <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? Colors.primary : Colors.textMute} />
          <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function StaffTicketDetailScreen() {
  return (
    <PermissionGuard permission={P.TICKET_VIEW}>
      <StaffTicketDetailScreenInner />
    </PermissionGuard>
  );
}

function StaffTicketDetailScreenInner() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticketId = id ?? '';
  const accountId = useSessionStore((s) => s.user?.accountId);
  const imageHeaders = useAuthImageHeaders();
  const user = useSessionStore((s) => s.user);
  const canResolve = checkPermission(user, P.TICKET_RESOLVE); // GH-47
  const { data: ticket, isLoading, isError, refetch } = useStaffTicketDetail(ticketId);
  const { mutate: startTicket, isPending: isStarting } = useStartTicket(ticketId);
  const { mutate: holdTicket, isPending: isHolding } = useHoldTicket(ticketId);
  const { mutate: resumeTicket, isPending: isResuming } = useResumeTicket(ticketId);
  const { mutate: resolveTicket, isPending: isResolving } = useResolveTicket(ticketId);
  const { mutate: escalateTicket, isPending: isEscalating } = useEscalateTicket(ticketId);
  const { mutate: addComment, isPending: isSending } = useStaffAddComment(ticketId);
  const { mutate: addLog, isPending: isAddingLog } = useAddMaintenanceLog(ticketId);
  const { mutate: updateLog, isPending: isUpdatingLog } = useUpdateMaintenanceLog(ticketId);
  const { mutateAsync: uploadAttachment, isPending: isUploading } = useUploadCommentAttachment();
  const { data: kbRefs, isLoading: kbRefsLoading } = useTicketKbRefs(ticketId || undefined);
  const { mutate: removeKbRef } = useRemoveKbRef(ticketId);

  // GH-44 — comments/activities qua GET riêng + realtime (Staff thấy cả comment internal).
  const commentsQuery = useTicketChatsCursor(ticketId || undefined);
  const activitiesQuery = useTicketActivities(ticketId || undefined);
  const { isConnected, typingUsers, notifyTyping } = useTicketCommentsRealtime(ticketId || undefined);
  const { mutate: updateChat, isPending: editChatPending } = useUpdateTicketChat(ticketId);
  const { mutate: deleteChat, isPending: deleteChatPending } = useDeleteTicketChat(ticketId);
  const { mutate: markChatsRead } = useMarkTicketChatsRead(ticketId);
  const { mutateAsync: translateChat } = useTranslateTicketChat(ticketId);
  const { mutate: addReaction } = useAddReaction(ticketId);
  const { mutate: removeReaction } = useRemoveReaction(ticketId);
  const { mutateAsync: downloadAttachment } = useDownloadChatAttachment(ticketId);
  const { data: unreadCount = 0 } = useTicketUnreadCount(ticketId || undefined);
  const { mutateAsync: transcribeVoice, isPending: transcribing } = useTranscribeVoiceChat(ticketId);
  // GH-67 — ghim chat. pinningId theo dõi bubble đang thao tác để hiện spinner đúng chỗ.
  const { mutate: pinChat, isPending: pinChatPending, variables: pinningVar } = usePinChat(ticketId);
  const { mutate: unpinChat, isPending: unpinChatPending, variables: unpinningVar } = useUnpinChat(ticketId);
  const pinningId = pinChatPending ? pinningVar : unpinChatPending ? unpinningVar : null;
  const voiceRecorder = useVoiceRecorder();
  // Trung bình biên độ hiện tại — điều khiển quả cầu "thở" theo giọng nói trong VoiceRecordingModal.
  const voiceLevel =
    voiceRecorder.waveform.reduce((sum, v) => sum + v, 0) / voiceRecorder.waveform.length;

  const [activeTab, setActiveTab] = useState<TabKey>('comments');
  const [chatTab, setChatTab] = useState<ChatTab>('public');
  const [commentText, setCommentText] = useState('');
  const [attachments, setAttachments] = useState<AttachmentForm[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [commentAttachments, setCommentAttachments] = useState<UploadedAttachment[]>([]);
  const [uploadingComment, setUploadingComment] = useState(false);
  const [showHold, setShowHold] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLogDTO | null>(null);
  const [showKbPicker, setShowKbPicker] = useState(false);

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
  // GH-44: bỏ auto scrollToEnd — comments giờ DESC (newest-first).
  const isActioning = isStarting || isHolding || isResuming || isResolving || isEscalating;

  // Staff thấy cả comment internal — flatten các page (DESC newest-first), KHÔNG filter internal.
  // Dedup theo id: offset-pagination + realtime prepend có thể trả trùng 1 comment ở ranh giới trang.
  const seenCommentIds = new Set<string>();
  const comments = (commentsQuery.data?.pages ?? [])
    .flatMap((p) => p?.items ?? [])
    .filter((c) => {
      if (seenCommentIds.has(c.id)) return false;
      seenCommentIds.add(c.id);
      return true;
    });
  const activities = activitiesQuery.data ?? [];
  // Chỉ cho sửa log khi: là chủ log + ticket chưa đóng (BE cũng chặn 403 các case này).
  const ticketClosed = ['Resolved', 'ClosedPendingRate', 'Closed', 'ClosedRejected'].includes(ticket?.status ?? '');
  const canEditLog = (log: MaintenanceLogDTO) => !ticketClosed && !!accountId && log.staffId === accountId;

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để đính kèm.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const name = asset.fileName ?? `img_${Date.now()}.jpg`;
    try {
      const uploaded = await uploadAttachment({ uri: asset.uri, name, type: mimeType });
      setAttachments((prev) => [...prev, uploaded]);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
    }
  };

  const handleRemoveAttachment = (fileId: string) => {
    setAttachments((prev) => prev.filter((a) => a.fileId !== fileId));
  };

  const handleSendComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed && commentAttachments.length === 0) return;
    addComment(
      {
        body: trimmed,
        isInternal: chatTab === 'internal',
        attachments: commentAttachments.length > 0 ? commentAttachments : undefined,
      },
      {
        onSuccess: () => {
          setCommentText('');
          setCommentAttachments([]);
          // Realtime đẩy CommentAdded về (cả người gửi) → setQueryData. Chỉ fallback khi mất kết nối.
          if (!isConnected) commentsQuery.refetch();
        },
      },
    );
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

  // GH-44 #4 — sửa maintenance log (PATCH). Form trả MaintenanceLogPayload (gán được vào UpdateMaintenanceLogPayload).
  const handleUpdateLog = (data: UpdateMaintenanceLogPayload) => {
    if (!editingLog) return;
    updateLog({ logId: editingLog.id, data }, { onSuccess: () => setEditingLog(null) });
  };

  // GH-44 #6 — gỡ KB reference (có xác nhận).
  const handleRemoveRef = (referenceId: string) => {
    Alert.alert('Gỡ bài KB', 'Gỡ tham chiếu bài viết này khỏi ticket?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gỡ', style: 'destructive', onPress: () => removeKbRef(referenceId) },
    ]);
  };

  const handleStart = () => { startTicket(undefined); };
  const handleHold = (reason: PauseReasonEnum, note?: string) => { holdTicket({ reason, note }, { onSuccess: () => setShowHold(false) }); };
  const handleResume = () => { resumeTicket(undefined); };
  const handleResolve = (summary: string) => { resolveTicket({ resolutionSummary: summary }, { onSuccess: () => setShowResolve(false) }); };
  const handleEscalate = (reason: EscalationReasonEnum, note?: string) => { escalateTicket({ reason, note }, { onSuccess: () => setShowEscalate(false) }); };
  const handleAddLog = (log: MaintenanceLogPayload) => { addLog(log, { onSuccess: () => setShowLogForm(false) }); };

  if (isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !ticket) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textFaint} />
        <Text style={styles.notFoundTitle}>Không tải được ticket</Text>
        <Text style={styles.notFoundText}>
          Ticket không tồn tại hoặc bạn không có quyền xem. Vui lòng thử lại.
        </Text>
        <Pressable style={styles.notFoundBtn} onPress={() => refetch()}>
          <Text style={styles.notFoundBtnText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const pColor = ticket.priority ? (PRIORITY_COLORS[ticket.priority] ?? PRIORITY_COLORS.P3Normal) : PRIORITY_COLORS.P3Normal;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior="padding"
      enabled={Platform.OS === 'ios'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerCode}>{ticket.code}</Text>
          <TicketStatusBadge status={ticket.status} />
        </View>
        <View style={styles.unreadSlot}>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Ionicons name="chatbubble" size={10} color="#FFF" />
              <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {activeTab === 'comments' ? (
        <View style={styles.chatScreen}>
          <View style={styles.chatTabRowWrap}>
            <TabsRow activeTab={activeTab} onChange={setActiveTab} />
          </View>

          <CommentThread
            comments={comments}
            currentUserId={accountId}
            imageHeaders={imageHeaders}
            onImagePress={setViewingImage}
            isLoading={commentsQuery.isLoading}
            hasNextPage={commentsQuery.hasNextPage}
            isFetchingNextPage={commentsQuery.isFetchingNextPage}
            onLoadMore={() => commentsQuery.fetchNextPage()}
            showTabs
            activeTab={chatTab}
            onTabChange={setChatTab}
            canEditAny={checkPermission(user, P.CHAT_EDIT_ANY)}
            canDeleteAny={checkPermission(user, P.CHAT_DELETE_ANY)}
            ticketClosed={ticketClosed}
            onEdit={(comment, body, editReason) =>
              updateChat({ chatId: comment.id, payload: { body, editReason } })
            }
            onDelete={(comment, reason) => deleteChat({ chatId: comment.id, reason })}
            editPending={editChatPending}
            deletePending={deleteChatPending}
            onMarkRead={handleMarkRead}
            onTranslate={handleTranslate}
            onPin={(comment) => pinChat(comment.id)}
            onUnpin={(comment) => unpinChat(comment.id)}
            pinningId={pinningId}
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

          {/* GH-67 — thanh AI/Export (Staff). Disable khi ticket đã đóng. */}
          <ChatAiToolbar
            ticketId={ticketId}
            disabled={ticketClosed}
            onInsert={(text) => setCommentText((prev) => (prev.trim() ? `${prev}\n${text}` : text))}
          />

          {/* "Đang nhập" — ngay trên ô input, nền transparent */}
          <TypingIndicator names={typingUsers.map((u) => u.displayName)} />

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
            <AttachmentPreviewStrip
              items={commentAttachments}
              imageHeaders={imageHeaders}
              disabled={uploadingComment}
              onRemove={(fileId) =>
                setCommentAttachments((prev) => prev.filter((a) => a.fileId !== fileId))
              }
            />
            <View style={styles.composerRow}>
              <AttachmentPicker
                compact
                hideThumbnails
                purpose={FilePurposeEnum.TicketAttachment}
                value={commentAttachments}
                onChange={setCommentAttachments}
                onUploadingChange={setUploadingComment}
              />
              <TextInput
                style={styles.composerInput}
                placeholder={chatTab === 'internal' ? 'Ghi chú nội bộ (khách không thấy)...' : 'Nhập tin nhắn...'}
                placeholderTextColor={Colors.textFaint}
                value={commentText}
                onChangeText={(t) => { setCommentText(t); notifyTyping(); }}
                multiline
              />
              <Pressable
                style={styles.internalToggle}
                onPress={handleStartRecording}
                disabled={chatTab === 'internal' || uploadingComment || transcribing}
              >
                {transcribing ? (
                  <ActivityIndicator size="small" color={Colors.textMute} />
                ) : (
                  <Ionicons name="mic-outline" size={17} color={chatTab === 'internal' ? Colors.textFaint : Colors.textMute} />
                )}
              </Pressable>
              <Pressable
                style={[styles.sendBtn, ((!commentText.trim() && commentAttachments.length === 0) || isSending || uploadingComment || voiceRecorder.isRecording) && styles.sendBtnDisabled]}
                onPress={handleSendComment}
                disabled={(!commentText.trim() && commentAttachments.length === 0) || isSending || uploadingComment || voiceRecorder.isRecording}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFF" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + Priority + SLA */}
        <View style={[styles.card, Shadow]}>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.priorityBadge, { backgroundColor: pColor.bg }]}>
              <Text style={[styles.priorityText, { color: pColor.text }]}>{ticket.priority ? (PRIORITY_LABELS[ticket.priority] ?? ticket.priority) : 'Chưa phân loại'}</Text>
            </View>
            <Text style={styles.metaCategory}>{ticket.category}</Text>
          </View>
          {ticket.slaTimer && <SlaCountdown sla={ticket.slaTimer} />}
          <View style={styles.durationRow}>
            <Text style={styles.durationLabel}>Thời gian xử lý</Text>
            <ProcessingDurationTimer activities={activities} status={ticket.status} />
          </View>
        </View>

        {/* Description */}
        {ticket.description && (
          <View style={[styles.card, Shadow]}>
            <Text style={styles.sectionLabel}>Mô tả</Text>
            <Text style={styles.descText}>{ticket.description}</Text>
          </View>
        )}

        {/* Ảnh khách đính kèm khi tạo ticket */}
        {(ticket.attachmentFileIds?.length ?? 0) > 0 && (
          <View style={[styles.card, Shadow]}>
            <Text style={styles.sectionLabel}>Ảnh đính kèm</Text>
            <AttachmentThumbnails fileIds={ticket.attachmentFileIds} size={72} onPressImage={setViewingImage} />
          </View>
        )}

        {/* Battery view entry point */}
        {ticket.batteryAssetId && (
          <Pressable
            style={[styles.logButton, Shadow]}
            onPress={() =>
              router.push({
                pathname: '/(staff)/batteries/[id]',
                params: { id: ticket.batteryAssetId as string },
              })
            }
          >
            <Ionicons name="battery-charging-outline" size={18} color={Colors.primary} />
            <Text style={styles.logButtonText}>Xem thông tin pin</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
          </Pressable>
        )}

        {/* Action Bar */}
        <TicketActionBar
          status={ticket.status}
          onStart={handleStart}
          onHold={() => setShowHold(true)}
          onResume={handleResume}
          onResolve={() => setShowResolve(true)}
          onEscalate={() => setShowEscalate(true)}
          isLoading={isActioning}
          canResolve={canResolve}
        />

        {/* Maintenance log button */}
        {(['InProgress', 'WaitingCustomer', 'WaitingParts', 'WaitingOnsiteSchedule'] as TicketStatusEnum[]).includes(ticket.status) && (
          <Pressable style={[styles.logButton, Shadow]} onPress={() => setShowLogForm(!showLogForm)}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
            <Text style={styles.logButtonText}>{showLogForm ? 'Ẩn nhật ký' : 'Thêm nhật ký bảo trì'}</Text>
          </Pressable>
        )}

        {showLogForm && (
          <MaintenanceLogForm onSubmit={handleAddLog} isLoading={isAddingLog} />
        )}

        <TabsRow activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'activities' && (
          <View style={styles.tabContent}>
            <ActivityTimeline activities={activities} />
          </View>
        )}

        {activeTab === 'logs' && (
          <View style={styles.tabContent}>
            {(ticket.maintenanceLogs ?? []).length === 0 ? (
              <Text style={styles.emptyTab}>Chưa có nhật ký bảo trì</Text>
            ) : (
              (ticket.maintenanceLogs ?? []).map((log) => (
                <View key={log.id} style={[styles.logCard, Shadow]}>
                  {!!log.summary && <Text style={styles.logDesc}>{log.summary}</Text>}
                  {!!log.actionsTaken && <Text style={styles.logMeta}>Hành động: {log.actionsTaken}</Text>}
                  {!!log.diagnosisDetails && <Text style={styles.logMeta}>Chẩn đoán: {log.diagnosisDetails}</Text>}
                  {!!log.resolutionNote && <Text style={styles.logMeta}>Kết quả: {log.resolutionNote}</Text>}
                  {log.durationMinutes > 0 && <Text style={styles.logMeta}>Thời gian: {log.durationMinutes} phút</Text>}
                  {(log.beforePhotosFileIds?.length ?? 0) > 0 && (
                    <>
                      <Text style={styles.logMeta}>Ảnh trước:</Text>
                      <AttachmentThumbnails fileIds={log.beforePhotosFileIds} size={64} />
                    </>
                  )}
                  {(log.afterPhotosFileIds?.length ?? 0) > 0 && (
                    <>
                      <Text style={styles.logMeta}>Ảnh sau:</Text>
                      <AttachmentThumbnails fileIds={log.afterPhotosFileIds} size={64} />
                    </>
                  )}
                  <Text style={styles.logTime}>{new Date(log.createdAt).toLocaleString('vi-VN')}</Text>
                  {canEditLog(log) && (
                    <Pressable style={styles.logEditBtn} onPress={() => setEditingLog(log)}>
                      <Ionicons name="create-outline" size={14} color={Colors.primary} />
                      <Text style={styles.logEditText}>Sửa</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'kb' && (
          <View style={styles.tabContent}>
            {/* Gán bài KB — chỉ Staff được phân công + ticket chưa đóng (BE chặn 403 nếu vi phạm) */}
            {!ticketClosed && !!accountId && ticket.assignedStaffId === accountId && (
              <Pressable style={styles.kbAssignBtn} onPress={() => setShowKbPicker(true)}>
                <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                <Text style={styles.kbAssignText}>Gán bài viết KB</Text>
              </Pressable>
            )}
            {kbRefsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
            ) : !kbRefs || kbRefs.length === 0 ? (
              <Text style={styles.emptyTab}>Chưa có bài KB nào được gán</Text>
            ) : (
              kbRefs.map((ref) => (
                <Pressable
                  key={ref.id}
                  style={[styles.kbRefCard, Shadow]}
                  onPress={() =>
                    router.push({
                      pathname: '/(staff)/kb/[id]' as never,
                      params: { id: ref.kbArticleId } as never,
                    } as never)
                  }
                >
                  <View style={styles.kbRefTop}>
                    <Ionicons name="book-outline" size={16} color={Colors.primary} />
                    <Text style={styles.kbRefCode}>{ref.kbArticleCode}</Text>
                    {!ticketClosed && !!accountId && ticket.assignedStaffId === accountId ? (
                      <Pressable
                        style={styles.kbRefDeleteBtn}
                        onPress={() => handleRemoveRef(ref.id)}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                      </Pressable>
                    ) : (
                      <Ionicons name="chevron-forward" size={14} color={Colors.textFaint} style={{ marginLeft: 'auto' }} />
                    )}
                  </View>
                  {ref.kbArticleTitle ? (
                    <Text style={styles.kbRefTitle}>{ref.kbArticleTitle}</Text>
                  ) : null}
                  {ref.note ? (
                    <Text style={styles.kbRefNote}>{ref.note}</Text>
                  ) : null}
                  <Text style={styles.kbRefTime}>{new Date(ref.createdAt).toLocaleDateString('vi-VN')}</Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      )}

      {/* Modals */}
      <VoiceRecordingModal
        visible={voiceRecorder.isRecording}
        elapsedSeconds={voiceRecorder.elapsedSeconds}
        level={voiceLevel}
        transcribing={transcribing}
        onStop={handleStopRecording}
        onCancel={voiceRecorder.cancel}
      />
      <HoldModal visible={showHold} onClose={() => setShowHold(false)} onSubmit={handleHold} isLoading={isHolding} />
      <ResolveModal visible={showResolve} onClose={() => setShowResolve(false)} onSubmit={handleResolve} isLoading={isResolving} />
      <EscalateModal visible={showEscalate} onClose={() => setShowEscalate(false)} onSubmit={handleEscalate} isLoading={isEscalating} />

      {/* GH-44 #4 — sửa maintenance log (PATCH) */}
      <Modal visible={editingLog !== null} transparent animationType="slide" onRequestClose={() => setEditingLog(null)}>
        <View style={styles.editOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditingLog(null)} />
          <View style={[styles.editSheet, { paddingBottom: insets.bottom + 16 }]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {editingLog && (
                <MaintenanceLogForm
                  isLoading={isUpdatingLog}
                  onSubmit={handleUpdateLog}
                  initialValues={{
                    summary: editingLog.summary ?? '',
                    actionsTaken: editingLog.actionsTaken ?? undefined,
                    durationMinutes: editingLog.durationMinutes || undefined,
                  }}
                  title="Sửa nhật ký bảo trì"
                  submitLabel="Cập nhật"
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* GH-44 #5/#7 — gán bài KB từ gợi ý */}
      <KbReferencePicker visible={showKbPicker} ticketId={ticketId} onClose={() => setShowKbPicker(false)} />

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
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, gap: 10 },
  notFoundTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 4 },
  notFoundText: { fontSize: 13, fontWeight: '500', color: Colors.textMute, textAlign: 'center', lineHeight: 19 },
  notFoundBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 14, backgroundColor: Colors.primary },
  notFoundBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerCode: { fontSize: 16, fontWeight: '800', color: Colors.text },
  unreadSlot: { width: 36, alignItems: 'flex-end', justifyContent: 'center' },
  unreadBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primary, borderRadius: 999,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  unreadText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  scrollBody: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  ticketTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '800' },
  metaCategory: { fontSize: 12, fontWeight: '600', color: Colors.textMute },
  durationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  durationLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMute },

  sectionLabel: { fontSize: 13, fontWeight: '800', color: Colors.text },
  descText: { fontSize: 13, fontWeight: '500', color: Colors.textMute, lineHeight: 20 },

  logButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.primaryLight,
  },
  logButtonText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 10,
  },
  tabActive: { backgroundColor: Colors.primaryLight },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.textMute },
  tabTextActive: { color: Colors.primaryDark },

  chatScreen: { flex: 1, backgroundColor: Colors.bg },
  chatTabRowWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  tabContent: { gap: 10 },
  emptyTab: { textAlign: 'center', fontSize: 13, color: Colors.textFaint, fontWeight: '600', paddingVertical: 24 },
  logEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: Colors.primaryLight },
  logEditText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  kbAssignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, backgroundColor: Colors.primary, marginBottom: 12 },
  kbAssignText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  kbRefDeleteBtn: { padding: 4, marginLeft: 'auto' },
  editOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  editSheet: { backgroundColor: Colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 12, maxHeight: '88%' },

  logCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, gap: 4,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  logDesc: { fontSize: 13, fontWeight: '700', color: Colors.text },
  logMeta: { fontSize: 12, fontWeight: '500', color: Colors.textMute },
  logTime: { fontSize: 11, fontWeight: '500', color: Colors.textFaint, marginTop: 4 },

  composerWrap: {
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: Colors.border,
  },
  attachmentList: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 16, paddingTop: 8,
  },
  attachmentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.card2, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5, maxWidth: 200,
  },
  attachmentName: { flex: 1, fontSize: 12, color: Colors.text, fontWeight: '500' },
  composer: {
    gap: 6,
    paddingHorizontal: 12, paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)',
  },
  composerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  composerInput: {
    flex: 1, minHeight: 40, maxHeight: 120,
    backgroundColor: Colors.card2, borderRadius: 22,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    fontSize: 15, color: Colors.text, fontWeight: '500',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...ShadowPrimary,
  },
  sendBtnDisabled: { backgroundColor: Colors.textFaint, shadowOpacity: 0 },

  imgOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', alignItems: 'center', justifyContent: 'center' },
  imgFull:     { width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.78 },
  imgCloseBtn: { position: 'absolute', right: 16 },

  internalToggle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card2,
    alignItems: 'center', justifyContent: 'center',
  },

  kbRefCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, gap: 6,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  kbRefTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kbRefCode: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  kbRefTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18 },
  kbRefNote: { fontSize: 12, fontWeight: '500', color: Colors.textMute, fontStyle: 'italic' },
  kbRefTime: { fontSize: 11, fontWeight: '500', color: Colors.textFaint },
});
