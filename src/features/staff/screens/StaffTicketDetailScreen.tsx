import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { useKeyboardVisible } from '@/src/hooks/useKeyboardVisible';
import { BadgeColors, Colors, Shadow, ShadowPrimary } from '@/src/lib/theme';
import { ActivityTimeline } from '@/src/features/tickets/components/ActivityTimeline';
import { TypingIndicator } from '@/src/features/tickets/components/TypingIndicator';
import { SlaCountdown } from '@/src/features/tickets/components/SlaCountdown';
import { TicketStatusBadge } from '@/src/features/tickets/components/TicketStatusBadge';
import { TicketActionBar } from '@/src/features/staff/components/TicketActionBar';
import { HoldModal } from '@/src/features/staff/components/HoldModal';
import { ResolveModal } from '@/src/features/staff/components/ResolveModal';
import { EscalateModal } from '@/src/features/staff/components/EscalateModal';
import { MaintenanceLogForm } from '@/src/features/staff/components/MaintenanceLogForm';
import { useStaffTicketDetail } from '@/src/features/staff/hooks/useStaffTicketDetail';
import { useHoldTicket } from '@/src/features/staff/hooks/useHoldTicket';
import { useResumeTicket } from '@/src/features/staff/hooks/useResumeTicket';
import { useResolveTicket } from '@/src/features/staff/hooks/useResolveTicket';
import { useEscalateTicket } from '@/src/features/staff/hooks/useEscalateTicket';
import { useChatSender } from '@/src/features/tickets/hooks/useChatSender';
import { staffTicketService } from '@/src/features/staff/services/staffTicket.service';
import { useAddMaintenanceLog } from '@/src/features/staff/hooks/useAddMaintenanceLog';
import { useUpdateMaintenanceLog } from '@/src/features/staff/hooks/useUpdateMaintenanceLog';
import { useTicketChatsCursor } from '@/src/features/tickets/hooks/useTicketChatsCursor';
import { useAddReaction, useRemoveReaction } from '@/src/features/tickets/hooks/useChatReactions';
import { useDownloadChatAttachment } from '@/src/features/tickets/hooks/useDownloadChatAttachment';
import { useTicketUnreadCount } from '@/src/features/tickets/hooks/useTicketUnreadCount';
import { MentionSuggestionsPopup } from '@/src/features/tickets/components/MentionSuggestionsPopup';
import { useTicketActivities } from '@/src/features/tickets/hooks/useTicketActivities';
import { useTicketCommentsRealtime } from '@/src/features/tickets/hooks/useTicketCommentsRealtime';
import {
  useUpdateTicketChat,
  useDeleteTicketChat,
  useMarkTicketChatsRead,
  useTranslateTicketChat,
  useTranscribeVoiceChat,
  usePinChat,
  useUnpinChat,
} from '@/src/features/tickets/hooks/useTicketChatActions';
import { isPrimaryHandler } from '@/src/features/tickets/utils/assignments';
import { useVoiceRecorder } from '@/src/features/tickets/hooks/useVoiceRecorder';
import { useAuthImageHeaders } from '@/src/features/file-storage/hooks/useAuthImageHeaders';
import { AuthImage } from '@/src/features/file-storage/components/AuthImage';
import { CommentThread, ChatTab } from '@/src/features/tickets/components/CommentThread';
import { ChatAiToolbar } from '@/src/features/tickets/components/ChatAiToolbar';
import { ChatReadersSheet } from '@/src/features/tickets/components/ChatReadersSheet';
import { VoiceRecordingModal } from '@/src/features/tickets/components/VoiceRecordingModal';
import { ProcessingDurationTimer } from '@/src/features/staff/components/ProcessingDurationTimer';
import { MaintenanceLogPayload, UpdateMaintenanceLogPayload } from '@/src/features/staff/types/staff.types';
import { EscalationReasonEnum, PauseReasonEnum, MaintenanceLogDTO } from '@/src/features/tickets/types/ticket.types';
import { canComplete, canEscalate, canHold, canResume, isTerminalTicket, shouldShowLiveSla } from '@/src/features/tickets/utils/ticketWorkflow';
import { PendingContextCard } from '@/src/features/tickets/components/PendingContextCard';
import type { ChatMentionInput } from '@/src/features/tickets/types/ticket.types';
import { AttachmentPicker, UploadedAttachment } from '@/src/features/file-storage/components/AttachmentPicker';
import { AttachmentPreviewStrip } from '@/src/features/file-storage/components/AttachmentPreviewStrip';
import { AttachmentThumbnails } from '@/src/features/file-storage/components/AttachmentThumbnails';
import { FilePurposeEnum } from '@/src/features/file-storage/enums/file-storage.enum';
import { useSessionStore } from '@/src/stores/sessionStore';
import { checkPermission, P } from '@/src/lib/authz';
import { PermissionGuard } from '@/src/features/auth/components/PermissionGuard';
import { useTicketKbRefs } from '@/src/features/kb/hooks/useTicketKbRefs';
import { useRemoveKbRef } from '@/src/features/kb/hooks/useRemoveKbRef';
import { KbReferencePicker } from '@/src/features/staff/components/KbReferencePicker';
import { KbSuggestionPanel } from '@/src/features/tickets/components/KbSuggestionPanel';
import { BackButton } from '@/src/shared/components/ScreenHeader';
import { BatteryWarningEvidencePanel } from '@/src/features/batteries/components/BatteryWarningEvidencePanel';

type TabKey = 'comments' | 'activities' | 'logs' | 'kb';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'comments',   label: 'Chat',      icon: 'chatbubbles-outline' },
  { key: 'activities', label: 'Details',   icon: 'time-outline' },
  { key: 'logs',       label: 'Logs',      icon: 'document-text-outline' },
  { key: 'kb',         label: 'KB Articles', icon: 'book-outline' },
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

function TabsRow({
  activeTab,
  onChange,
  unreadCount = 0,
}: {
  activeTab: TabKey;
  onChange: (key: TabKey) => void;
  /** UNREAD chat count — only shown on the "Chat" tab, not the total message count. */
  unreadCount?: number;
}) {
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
          {/* Hidden while this tab is open — a new message would flash the badge before
              the thread can mark it read, even though the user is already reading it. */}
          {tab.key === 'comments' && activeTab !== 'comments' && unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

export function StaffTicketDetailScreen() {
  return (
    <PermissionGuard permission={P.TICKET_VIEW}>
      <StaffTicketDetailScreenInner />
    </PermissionGuard>
  );
}

function StaffTicketDetailScreenInner() {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const ticketId = id ?? '';
  const accountId = useSessionStore((s) => s.user?.accountId);
  const imageHeaders = useAuthImageHeaders();
  const user = useSessionStore((s) => s.user);
  const canResolve = checkPermission(user, P.TICKET_RESOLVE); // GH-47
  const { data: ticket, isLoading, isError, refetch } = useStaffTicketDetail(ticketId);
  const { mutateAsync: holdTicket, isPending: isHolding } = useHoldTicket(ticketId);
  const { mutate: resumeTicket, isPending: isResuming } = useResumeTicket(ticketId);
  const { mutateAsync: resolveTicket, isPending: isResolving } = useResolveTicket(ticketId);
  const { mutateAsync: escalateTicket, isPending: isEscalating } = useEscalateTicket(ticketId);
  // Outbox — enqueue() doesn't await the BE, the worker sends sequentially with backoff retry.
  const { pending: pendingChats, enqueue: enqueueComment, retry: retryPendingComment, discard: discardPendingComment } =
    useChatSender(ticketId, staffTicketService.addComment);
  const { mutateAsync: addLog, isPending: isAddingLog } = useAddMaintenanceLog(ticketId);
  const { mutateAsync: updateLog, isPending: isUpdatingLog } = useUpdateMaintenanceLog(ticketId);
  const { data: kbRefs, isLoading: kbRefsLoading } = useTicketKbRefs(ticketId || undefined);
  const { mutate: removeKbRef } = useRemoveKbRef(ticketId);

  // GH-44 — comments/activities via a dedicated GET + realtime (Staff can see internal comments too).
  const commentsQuery = useTicketChatsCursor(ticketId || undefined);
  const activitiesQuery = useTicketActivities(ticketId || undefined);
  const { typingUsers, notifyTyping } = useTicketCommentsRealtime(ticketId || undefined);
  const { mutate: updateChat, isPending: editChatPending } = useUpdateTicketChat(ticketId);
  const { mutate: deleteChat, isPending: deleteChatPending } = useDeleteTicketChat(ticketId);
  const { mutate: markChatsRead } = useMarkTicketChatsRead(ticketId);
  const { mutateAsync: translateChat } = useTranslateTicketChat(ticketId);
  const { mutate: addReaction } = useAddReaction(ticketId);
  const { mutate: removeReaction } = useRemoveReaction(ticketId);
  const { mutateAsync: downloadAttachment } = useDownloadChatAttachment(ticketId);
  const { data: unreadCount = 0 } = useTicketUnreadCount(ticketId || undefined);
  const { mutateAsync: transcribeVoice, isPending: transcribing } = useTranscribeVoiceChat(ticketId);
  // GH-67 — pin chat. pinningId tracks the bubble being acted on so the spinner shows in the right place.
  const { mutate: pinChat, isPending: pinChatPending, variables: pinningVar } = usePinChat(ticketId);
  const { mutate: unpinChat, isPending: unpinChatPending, variables: unpinningVar } = useUnpinChat(ticketId);
  const pinningId = pinChatPending ? pinningVar : unpinChatPending ? unpinningVar : null;
  const voiceRecorder = useVoiceRecorder();
  // Current average amplitude — drives the "breathing" orb that follows the voice in VoiceRecordingModal.
  const voiceLevel =
    voiceRecorder.waveform.reduce((sum, v) => sum + v, 0) / voiceRecorder.waveform.length;

  const [activeTab, setActiveTab] = useState<TabKey>('comments');
  const [chatTab, setChatTab] = useState<ChatTab>('public');
  const [commentText, setCommentText] = useState('');
  // Mentions picked in the message being composed — BE receives them via the `mentions` field, does NOT parse '@' from the body.
  const [pickedMentions, setPickedMentions] = useState<ChatMentionInput[]>([]);
  // GH-133 — AI suggestions shown as a bubble at the end of the chat stream (like web). Tapping one →
  // fills the input, doesn't clear it; only cleared once the message is sent (onSuccess) or dismissed.
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  // Chat currently showing "read by" — Staff-only, BE blocks Customer (403).
  const [readersChatId, setReadersChatId] = useState<string | null>(null);
  const [commentAttachments, setCommentAttachments] = useState<UploadedAttachment[]>([]);
  const [uploadingComment, setUploadingComment] = useState(false);
  const [showHold, setShowHold] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLogDTO | null>(null);
  const [showKbPicker, setShowKbPicker] = useState(false);

  // Deep-link from push notification: ?tab=chat opens the chat tab. On the staff side that
  // tab is named 'comments' (TabKey), so we map it here instead of using the param value directly.
  useEffect(() => {
    if (tab === 'chat') setActiveTab('comments');
  }, [tab]);

  // GH-44: removed auto scrollToEnd — comments are now DESC (newest-first).
  const isActioning = isHolding || isResuming || isResolving || isEscalating;

  // Staff sees internal comments too — flatten pages (DESC newest-first), do NOT filter internal ones.
  // Dedup by id: offset-pagination + realtime prepend can return the same comment twice at a page boundary.
  const seenCommentIds = new Set<string>();
  const comments = (commentsQuery.data?.pages ?? [])
    .flatMap((p) => p?.items ?? [])
    .filter((c) => {
      if (seenCommentIds.has(c.id)) return false;
      seenCommentIds.add(c.id);
      return true;
    });
  const activities = activitiesQuery.data ?? [];
  // Editing a log is only allowed when: user is the log owner + ticket isn't closed (BE also blocks these cases with 403).
  const ticketClosed = ticket ? isTerminalTicket(ticket.status) : false;
  const canEditLog = (log: MaintenanceLogDTO) => !ticketClosed && !!accountId && log.staffId === accountId;

  const handleSendComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed && commentAttachments.length === 0) return;
    // Only send mentions still present in the body (user may have deleted the name).
    const activeMentions = pickedMentions.filter((m) =>
      trimmed.includes(`@${m.displayName.replace(/\s+/g, '_')}`),
    );
    // Outbox — doesn't await the BE. The optimistic bubble shows right away; a failure (if
    // any) shows on that same bubble via PendingBubble (retry/discard), not the composer.
    void enqueueComment({
      body: trimmed,
      isInternal: chatTab === 'internal',
      mentions: activeMentions.length > 0 ? activeMentions : undefined,
      attachments: commentAttachments.length > 0 ? commentAttachments : undefined,
    });
    setCommentText('');
    setPickedMentions([]);
    setCommentAttachments([]);
    setAiSuggestions([]);
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
      Alert.alert('Access permission', 'Microphone access is required to record audio.');
    }
  };
  const handleStopRecording = async () => {
    const file = await voiceRecorder.stop();
    if (!file) return;
    try {
      await transcribeVoice(file);
    } catch {
      // handleErrorApi in the hook already shows an Alert for the error — no extra handling needed here.
    }
  };

  // GH-44 #4 — edit maintenance log (PATCH). The form returns MaintenanceLogPayload (assignable to UpdateMaintenanceLogPayload).
  // mutateAsync (not mutate) — the form's try/catch needs the rejection to map EntityError to the right field.
  const handleUpdateLog = async (data: UpdateMaintenanceLogPayload) => {
    if (!editingLog) return;
    await updateLog({ logId: editingLog.id, data });
    setEditingLog(null);
  };

  // GH-44 #6 — remove KB reference (with confirmation).
  const handleRemoveRef = (referenceId: string) => {
    Alert.alert('Remove KB article', 'Remove this article reference from the ticket?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeKbRef(referenceId) },
    ]);
  };

  // mutateAsync (not mutate) — each modal's try/catch needs the rejection to map EntityError to the right field.
  const handleHold = async (reason: PauseReasonEnum, note: string, appointment: Date) => {
    await holdTicket({ reason, note: note.trim(), rescheduledStartAt: appointment.toISOString() });
    setShowHold(false);
  };
  const handleResume = () => { resumeTicket({ reason: 'Blocking condition cleared.' }); };
  const handleResolve = async (summary: string) => {
    await resolveTicket({ resolutionSummary: summary });
    setShowResolve(false);
  };
  const handleEscalate = async (reason: EscalationReasonEnum, note: string) => {
    await escalateTicket({ reason, note: note.trim() });
    setShowEscalate(false);
  };
  const handleAddLog = async (log: MaintenanceLogPayload) => {
    await addLog(log);
    setShowLogForm(false);
  };

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
        <Text style={styles.notFoundTitle}>Failed to load ticket</Text>
        <Text style={styles.notFoundText}>
          {"The ticket doesn't exist or you don't have permission to view it. Please try again."}
        </Text>
        <Pressable style={styles.notFoundBtn} onPress={() => refetch()}>
          <Text style={styles.notFoundBtnText}>Retry</Text>
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
      // The view spans from y=0 so KAV can't auto-subtract the bottom safe area: it pushes
      // up by exactly the home indicator's height, creating a gap between the composer and
      // the keyboard. A negative offset compensates for that.
      keyboardVerticalOffset={-insets.bottom}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={styles.headerCode}>{ticket.code}</Text>
          <TicketStatusBadge status={ticket.status} />
        </View>
        {/* Spacer keeps the header balanced. The unread badge lives on the "Chat" tab,
            not repeated here to avoid two places reporting the same number. */}
        <View style={styles.unreadSlot} />
      </View>

      {activeTab === 'comments' ? (
        <View style={styles.chatScreen}>
          <View style={styles.chatTabRowWrap}>
            <TabsRow activeTab={activeTab} onChange={setActiveTab} unreadCount={unreadCount} />
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
            ticketClosed={ticketClosed}
            pendingMessages={pendingChats}
            onRetryPending={retryPendingComment}
            onDiscardPending={discardPendingComment}
            onEdit={(comment, body, editReason) =>
              updateChat({ chatId: comment.id, payload: { body, editReason } })
            }
            onDelete={(comment, reason) => deleteChat({ chatId: comment.id, reason })}
            editPending={editChatPending}
            deletePending={deleteChatPending}
            onMarkRead={handleMarkRead}
            onShowReaders={(comment) => setReadersChatId(comment.id)}
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
              // Sequential — avoids multiple share sheets opening at once (the 2nd share sheet gets swallowed).
              void (async () => {
                for (const fid of fileIds) {
                  try {
                    await downloadAttachment({ chatId: comment.id, fileId: fid, fileName: `file-${fid.slice(0, 8)}` });
                  } catch (e) {
                    Alert.alert('Download file', (e as Error).message);
                    break;
                  }
                }
              })();
            }}
            aiSuggestions={aiSuggestions}
            onPickSuggestion={(text) => setCommentText(text)}
            onDismissSuggestions={() => setAiSuggestions([])}
          />

          {/* GH-67 — thanh AI/Export (Staff). Disable khi ticket đã đóng. */}
          <ChatAiToolbar
            ticketId={ticketId}
            disabled={ticketClosed}
            onSuggestions={setAiSuggestions}
          />

          {/* Autocomplete Popup @Mention when typing @ */}
          <MentionSuggestionsPopup
            text={commentText}
            ticketId={ticketId}
            isInternal={chatTab === 'internal'}
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

          {/* "Typing" indicator — right above the input, transparent background */}
          <TypingIndicator names={typingUsers.map((u) => u.displayName)} />

          <View
            style={[
              styles.composer,
              // The open keyboard already covers the home indicator area — adding insets.bottom
              // here would just create extra whitespace between the input and the keyboard.
              { paddingBottom: !keyboardVisible && insets.bottom > 0 ? insets.bottom + 8 : 12 }
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
                placeholder={chatTab === 'internal' ? 'Internal note (not visible to customer)...' : 'Type a message...'}
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
                style={[styles.sendBtn, ((!commentText.trim() && commentAttachments.length === 0) || uploadingComment || voiceRecorder.isRecording) && styles.sendBtnDisabled]}
                onPress={handleSendComment}
                disabled={(!commentText.trim() && commentAttachments.length === 0) || uploadingComment || voiceRecorder.isRecording}
              >
                {/* Send button has a yellow background → white icon gets lost, use dark ink instead. */}
                <Ionicons name="send" size={18} color={Colors.text} />
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
              <Text style={[styles.priorityText, { color: pColor.text }]}>{ticket.priority ? (PRIORITY_LABELS[ticket.priority] ?? ticket.priority) : 'Untriaged'}</Text>
            </View>
            <Text style={styles.metaCategory}>{ticket.category}</Text>
          </View>
          {ticket.slaTimer && shouldShowLiveSla(ticket.status, ticket.priority, ticket.slaTimer.status) && <SlaCountdown sla={ticket.slaTimer} />}
          <View style={styles.durationRow}>
            <Text style={styles.durationLabel}>Processing time</Text>
            <ProcessingDurationTimer activities={activities} status={ticket.status} />
          </View>
        </View>

        {/* Description */}
        {ticket.description && (
          <View style={[styles.card, Shadow]}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.descText}>{ticket.description}</Text>
          </View>
        )}

        {/* Warning evidence — sensor logs exceeding threshold around the time the issue was detected.
            Auto-hides when the ticket has no batteryAssetId or detectedAt. */}
        {ticket.batteryAssetId && ticket.detectedAt && (
          <View style={[styles.card, Shadow]}>
            <BatteryWarningEvidencePanel
              batteryAssetId={ticket.batteryAssetId}
              detectedAt={ticket.detectedAt}
            />
          </View>
        )}

        {/* Photos the customer attached when creating the ticket */}
        {(ticket.attachmentFileIds?.length ?? 0) > 0 && (
          <View style={[styles.card, Shadow]}>
            <Text style={styles.sectionLabel}>Attachments</Text>
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
            <Text style={styles.logButtonText}>View battery info</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
          </Pressable>
        )}

        {/* Action Bar */}
        <TicketActionBar
          status={ticket.status}
          onHold={() => setShowHold(true)}
          onResume={handleResume}
          onResolve={() => setShowResolve(true)}
          onEscalate={() => setShowEscalate(true)}
          isLoading={isActioning}
          canResolve={canResolve && canComplete(ticket, accountId)}
          canHold={canHold(ticket, accountId)}
          canResume={canResume(ticket, accountId)}
          canEscalate={canEscalate(ticket, accountId)}
        />
        <PendingContextCard ticket={ticket} />

        {/* Maintenance log button */}
        {ticket.status === 'InProgress' && !!accountId && isPrimaryHandler(ticket.assignments, accountId) && (
          <Pressable style={[styles.logButton, Shadow]} onPress={() => setShowLogForm(!showLogForm)}>
            <Text style={styles.logButtonText}>{showLogForm ? 'Hide log form' : 'Add maintenance log'}</Text>
          </Pressable>
        )}

        {showLogForm && (
          <MaintenanceLogForm onSubmit={handleAddLog} isLoading={isAddingLog} />
        )}

        <TabsRow activeTab={activeTab} onChange={setActiveTab} unreadCount={unreadCount} />

        {activeTab === 'activities' && (
          <View style={styles.tabContent}>
            <ActivityTimeline activities={activities} />
          </View>
        )}

        {activeTab === 'logs' && (
          <View style={styles.tabContent}>
            {(ticket.maintenanceLogs ?? []).length === 0 ? (
              <Text style={styles.emptyTab}>No maintenance logs yet</Text>
            ) : (
              (ticket.maintenanceLogs ?? []).map((log) => (
                <View key={log.id} style={[styles.logCard, Shadow]}>
                  {!!log.summary && <Text style={styles.logDesc}>{log.summary}</Text>}
                  {!!log.actionsTaken && <Text style={styles.logMeta}>Action: {log.actionsTaken}</Text>}
                  {!!log.diagnosisDetails && <Text style={styles.logMeta}>Diagnosis: {log.diagnosisDetails}</Text>}
                  {!!log.resolutionNote && <Text style={styles.logMeta}>Result: {log.resolutionNote}</Text>}
                  {log.durationMinutes > 0 && <Text style={styles.logMeta}>Duration: {log.durationMinutes} mins</Text>}
                  {(log.beforePhotosFileIds?.length ?? 0) > 0 && (
                    <>
                      <Text style={styles.logMeta}>Before photos:</Text>
                      <AttachmentThumbnails fileIds={log.beforePhotosFileIds} size={64} />
                    </>
                  )}
                  {(log.afterPhotosFileIds?.length ?? 0) > 0 && (
                    <>
                      <Text style={styles.logMeta}>After photos:</Text>
                      <AttachmentThumbnails fileIds={log.afterPhotosFileIds} size={64} />
                    </>
                  )}
                  <Text style={styles.logTime}>{new Date(log.createdAt).toLocaleString('vi-VN')}</Text>
                  {canEditLog(log) && (
                    <Pressable style={styles.logEditBtn} onPress={() => setEditingLog(log)}>
                      <Ionicons name="create-outline" size={14} color={Colors.primary} />
                      <Text style={styles.logEditText}>Edit</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'kb' && (
          <View style={styles.tabContent}>
            {/* AI đề xuất tài liệu — đặt TRƯỚC danh sách đã gán vì đây là thứ dẫn tới
                hành động, còn danh sách dưới là kết quả đã chốt.
                `enabled` gắn với tab: chỉ gọi AI khi người dùng thật sự mở tab này.
                Chỉ đọc + điều hướng; việc gắn tài liệu vẫn qua nút "Gán bài viết KB"
                bên dưới, đúng phân quyền PrimaryHandler của BE. */}
            <KbSuggestionPanel
              ticketId={ticketId}
              topN={3}
              enabled={activeTab === 'kb'}
              onOpen={(kb) =>
                router.push({
                  pathname: '/(staff)/kb/[id]' as never,
                  params: { id: kb.kbArticleId } as never,
                } as never)
              }
            />

            {/* Gán bài KB — chỉ Staff được phân công + ticket chưa đóng (BE chặn 403 nếu vi phạm) */}
            {!ticketClosed && !!accountId && isPrimaryHandler(ticket.assignments, accountId) && (
              <Pressable style={styles.kbAssignBtn} onPress={() => setShowKbPicker(true)}>
                <Text style={styles.kbAssignText}>Assign KB article</Text>
              </Pressable>
            )}

            <Text style={styles.kbSectionLabel}>Assigned articles</Text>
            {kbRefsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
            ) : !kbRefs || kbRefs.length === 0 ? (
              <Text style={styles.emptyTab}>No KB articles assigned yet</Text>
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
                    {!ticketClosed && !!accountId && isPrimaryHandler(ticket.assignments, accountId) ? (
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
                    logType: editingLog.logType,
                    actionsTaken: editingLog.actionsTaken ?? undefined,
                    durationMinutes: editingLog.durationMinutes || undefined,
                  }}
                  title="Edit Maintenance Log"
                  submitLabel="Update"
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ai đã đọc 1 chat — Staff/Manager/Admin only */}
      <ChatReadersSheet
        ticketId={ticketId}
        chatId={readersChatId}
        onClose={() => setReadersChatId(null)}
      />

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
  // Chữ đen trên nền trắng — #FFD500 chỉ đạt ~1.5:1 contrast, đọc rất khó.
  logButtonText: { fontSize: 13, fontWeight: '700', color: Colors.text },

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
  // Badge chưa đọc trên tab "Trao đổi" — cùng kiểu với màn Customer.
  tabBadge: {
    backgroundColor: Colors.danger, // đỏ = chưa đọc, thống nhất với web

    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  chatScreen: { flex: 1, backgroundColor: Colors.bg },
  chatTabRowWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  tabContent: { gap: 10 },
  emptyTab: { textAlign: 'center', fontSize: 13, color: Colors.textFaint, fontWeight: '600', paddingVertical: 24 },
  logEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: Colors.primaryLight },
  logEditText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  kbAssignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, backgroundColor: Colors.primary, marginTop: 14, marginBottom: 4 },
  // Nhãn phân tách "AI đề xuất" (ở trên) với "đã gán" (ở dưới) — không có nó thì hai
  // khối card trông như một danh sách, dễ tưởng gợi ý đã được gắn vào ticket.
  kbSectionLabel: { fontSize: 12, fontWeight: '800', color: Colors.textMute, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 14, marginBottom: 8 },
  kbAssignText: { color: Colors.text, fontSize: 13, fontWeight: '700' },
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
