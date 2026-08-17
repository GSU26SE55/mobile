import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAvoidingView, KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuthContext } from '../../../context/authContext';
import { P, checkPermission } from '../../../lib/authz';
import { formatDate } from '../../../lib/date';
import { Colors, Shadow } from '../../../lib/theme';
import { useSessionStore } from '../../../stores/sessionStore';

import {
  AttachmentPicker,
  type UploadedAttachment,
} from '../../file-storage/components/AttachmentPicker';
import { AttachmentPreviewStrip } from '../../file-storage/components/AttachmentPreviewStrip';
import { AuthImage } from '../../file-storage/components/AuthImage';
import { FilePurposeEnum } from '../../file-storage/enums/file-storage.enum';
import { useAuthImageHeaders } from '../../file-storage/hooks/useAuthImageHeaders';

import { EscalateModal } from '../../staff/components/EscalateModal';
import { HoldModal } from '../../staff/components/HoldModal';
import { KbReferencePicker } from '../../staff/components/KbReferencePicker';
import { MaintenanceLogForm } from '../../staff/components/MaintenanceLogForm';
import { ResolveModal } from '../../staff/components/ResolveModal';
import { StaffTicketCard } from '../../staff/components/StaffTicketCard';
import { TicketActionBar } from '../../staff/components/TicketActionBar';
import { useAddMaintenanceLog } from '../../staff/hooks/useAddMaintenanceLog';
import { useEscalateTicket } from '../../staff/hooks/useEscalateTicket';
import { useHoldTicket } from '../../staff/hooks/useHoldTicket';
import { useResolveTicket } from '../../staff/hooks/useResolveTicket';
import { useResumeTicket } from '../../staff/hooks/useResumeTicket';
import { staffTicketService } from '../../staff/services/staffTicket.service';
import { useStaffTicketDetail } from '../../staff/hooks/useStaffTicketDetail';
import { useStaffTickets } from '../../staff/hooks/useStaffTickets';
import { useUpdateMaintenanceLog } from '../../staff/hooks/useUpdateMaintenanceLog';
import type { MaintenanceLogPayload, UpdateMaintenanceLogPayload } from '../../staff/types/staff.types';

import { useRemoveKbRef } from '../../kb/hooks/useRemoveKbRef';
import { useTicketKbRefs } from '../../kb/hooks/useTicketKbRefs';

import { ActivityTimeline } from '../../tickets/components/ActivityTimeline';
import { ChatAiToolbar } from '../../tickets/components/ChatAiToolbar';
import { CommentThread, type ChatTab } from '../../tickets/components/CommentThread';
import { MentionSuggestionsPopup } from '../../tickets/components/MentionSuggestionsPopup';
import { RateModal } from '../../tickets/components/RateModal';
import { ReopenModal } from '../../tickets/components/ReopenModal';
import { SlaCountdown } from '../../tickets/components/SlaCountdown';
import { canComplete, canEscalate, canHold, canRateOrReopen, canResume, isPrimaryHandler, isTicketChatLocked, shouldShowLiveSla } from '../../tickets/utils/ticketWorkflow';
import { TicketCard } from '../../tickets/components/TicketCard';
import { TicketStatusBadge } from '../../tickets/components/TicketStatusBadge';
import { TypingIndicator } from '../../tickets/components/TypingIndicator';
import { VoiceRecordingModal } from '../../tickets/components/VoiceRecordingModal';

import { useChatSender } from '../../tickets/hooks/useChatSender';
import { ticketService } from '../../tickets/services/ticket.service';
import { useAddReaction, useRemoveReaction } from '../../tickets/hooks/useChatReactions';
import { useDownloadChatAttachment } from '../../tickets/hooks/useDownloadChatAttachment';
import { useRateTicket } from '../../tickets/hooks/useRateTicket';
import { useReopenTicket } from '../../tickets/hooks/useReopenTicket';

import {
  useDeleteTicketChat,
  useMarkTicketChatsRead,
  usePinChat,
  useTranscribeVoiceChat,
  useTranslateTicketChat,
  useUnpinChat,
  useUpdateTicketChat,
} from '../../tickets/hooks/useTicketChatActions';

import { useTicketActivities } from '../../tickets/hooks/useTicketActivities';
import { useTicketChatsCursor } from '../../tickets/hooks/useTicketChatsCursor';
import { useTicketCommentsRealtime } from '../../tickets/hooks/useTicketCommentsRealtime';
import { useTicketDetail } from '../../tickets/hooks/useTicketDetail';
import { useTickets } from '../../tickets/hooks/useTickets';
import { useTicketUnreadCount } from '../../tickets/hooks/useTicketUnreadCount';
import { useUploadCommentAttachment } from '../../tickets/hooks/useUploadCommentAttachment';
import { useVoiceRecorder } from '../../tickets/hooks/useVoiceRecorder';

import type {
  EscalationReasonEnum,
  MaintenanceLogDTO,
  PauseReasonEnum,
  RatePayload,
  ReopenPayload,
  TicketDTO,
} from '../../tickets/types/ticket.types';
import { notificationService } from '../services/notification.service';

interface BubbleLaunchProps {
  ticketId?: string;
  notificationId?: string;
}

type ViewMode = 'chat' | 'details';
type DetailSubTab = 'details' | 'activities' | 'logs' | 'kb';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const CATEGORY_LABEL: Record<string, string> = {
  Charging: 'Charging',
  Overheat: 'Overheating',
  NoPower: 'Power Loss',
  Performance: 'Performance',
  Repair: 'Repair',
  Other: 'Other',
};

const PRIORITY_LABEL: Record<string, string> = {
  P1Critical: 'P1',
  P2High: 'P2',
  P3Normal: 'P3',
};

function BubbleChat({ ticketId: initialTicketId = '', notificationId }: BubbleLaunchProps) {
  const insets = useSafeAreaInsets();
  const { isHydrating } = useAuthContext();
  const user = useSessionStore((state) => state.user);
  const accountId = user?.accountId;
  const isOperator = !!user && user.role !== 'CUSTOMER';
  const imageHeaders = useAuthImageHeaders();

  // Active state
  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialTicketId || null);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [detailSubTab, setDetailSubTab] = useState<DetailSubTab>('details');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync initial launch ticketId
  useEffect(() => {
    if (initialTicketId) {
      setActiveTicketId(initialTicketId);
      setViewMode('chat');
    }
  }, [initialTicketId]);

  useEffect(() => {
    if (notificationId) void notificationService.markOpened(notificationId).catch(() => {});
  }, [notificationId]);

  // List queries
  const customerTicketsQuery = useTickets(undefined, { enabled: !isOperator });
  const staffTicketsQuery = useStaffTickets(undefined, { enabled: isOperator });

  // Ticket Detail queries
  const customerDetailQuery = useTicketDetail(!isOperator && activeTicketId ? activeTicketId : '');
  const staffDetailQuery = useStaffTicketDetail(isOperator && activeTicketId ? activeTicketId : '');

  const ticketDetail = isOperator ? staffDetailQuery.data : customerDetailQuery.data;
  const ticketLoading = isOperator ? staffDetailQuery.isLoading : customerDetailQuery.isLoading;

  const commentsQuery = useTicketChatsCursor(activeTicketId || undefined);
  const activitiesQuery = useTicketActivities(activeTicketId || undefined);
  const unreadCountQuery = useTicketUnreadCount(activeTicketId || undefined);
  const unreadCount = unreadCountQuery.data ?? 0;

  const { typingUsers, notifyTyping } = useTicketCommentsRealtime(activeTicketId || undefined);

  // Chat hooks
  const targetId = activeTicketId ?? '';
  // Outbox — enqueue() doesn't await the BE, the worker sends sequentially with backoff retry.
  // `send` picks the right service per role (isOperator can change while the ticket stays the
  // same, so it must be a dependency).
  const send = useCallback(
    (ticketId: string, payload: Parameters<typeof staffTicketService.addComment>[1]) =>
      isOperator
        ? staffTicketService.addComment(ticketId, payload)
        : ticketService.addComment(ticketId, { ...payload, isInternal: false }),
    [isOperator],
  );
  const { pending: pendingChats, enqueue: enqueueComment, retry: retryPendingComment, discard: discardPendingComment } =
    useChatSender(targetId, send);
  const customerUpload = useUploadCommentAttachment();
  const updateChat = useUpdateTicketChat(targetId);
  const deleteChat = useDeleteTicketChat(targetId);
  const markChatsRead = useMarkTicketChatsRead(targetId);
  const translateChat = useTranslateTicketChat(targetId);
  const addReaction = useAddReaction(targetId);
  const removeReaction = useRemoveReaction(targetId);
  const downloadAttachment = useDownloadChatAttachment(targetId);
  const transcribeVoice = useTranscribeVoiceChat(targetId);
  const pinChat = usePinChat(targetId);
  const unpinChat = useUnpinChat(targetId);
  const voiceRecorder = useVoiceRecorder();

  // Action hooks
  const holdTicket = useHoldTicket(targetId);
  const resumeTicket = useResumeTicket(targetId);
  const resolveTicket = useResolveTicket(targetId);
  const escalateTicket = useEscalateTicket(targetId);
  const addLog = useAddMaintenanceLog(targetId);
  const updateLog = useUpdateMaintenanceLog(targetId);

  const kbRefsQuery = useTicketKbRefs(isOperator && activeTicketId ? activeTicketId : undefined);
  const removeKbRef = useRemoveKbRef(targetId);

  const rateTicket = useRateTicket(targetId);
  const reopenTicket = useReopenTicket(targetId);

  // UI state for modals
  const [chatTab, setChatTab] = useState<ChatTab>('public');
  const [commentText, setCommentText] = useState('');
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [operatorUploading, setOperatorUploading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [showHold, setShowHold] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLogDTO | null>(null);
  const [showKbPicker, setShowKbPicker] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  const comments = useMemo(() => {
    const seen = new Set<string>();
    return (commentsQuery.data?.pages ?? [])
      .flatMap((page) => page?.items ?? [])
      .filter((comment) => {
        if ((!isOperator && comment.isInternal) || seen.has(comment.id)) return false;
        seen.add(comment.id);
        return true;
      });
  }, [commentsQuery.data?.pages, isOperator]);

  const publicCount = useMemo(() => comments.filter((c) => !c.isInternal).length, [comments]);
  const internalCount = useMemo(() => comments.filter((c) => c.isInternal).length, [comments]);

  const ticketStatus = ticketDetail?.status;
  // Chat khoá khi ticket đã xong việc: Completed/Closed/ClosedRejected. Khớp với web.
  const chatLocked = ticketStatus ? isTicketChatLocked(ticketStatus) : false;
  const pinningId = pinChat.isPending
    ? pinChat.variables
    : unpinChat.isPending
      ? unpinChat.variables
      : null;
  const voiceLevel = voiceRecorder.waveform.reduce((sum, value) => sum + value, 0)
    / Math.max(1, voiceRecorder.waveform.length);

  const handleSend = () => {
    const body = commentText.trim();
    if (!body && attachments.length === 0) return;
    // Outbox — doesn't await the BE. The optimistic bubble shows right away; a failure (if
    // any) shows on that same bubble via PendingBubble (retry/discard), not the composer.
    void enqueueComment({
      body,
      isInternal: isOperator ? chatTab === 'internal' : false,
      attachments: attachments.length ? attachments : undefined,
    });
    setCommentText('');
    setAttachments([]);
    setAiSuggestions([]);
  };

  const handleCustomerPickAttachment = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Photo library access is required to attach a file.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    try {
      const uploaded = await customerUpload.mutateAsync({
        uri: asset.uri,
        name: asset.fileName ?? `attachment_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
      setAttachments((current) => [...current, uploaded]);
    } catch {
      Alert.alert('Error', 'Could not upload the file. Please try again.');
    }
  };

  const handleStartVoice = async () => {
    try {
      await voiceRecorder.start();
    } catch {
      Alert.alert('Permission Required', 'Microphone access is required to record audio.');
    }
  };

  const handleStopVoice = async () => {
    const file = await voiceRecorder.stop();
    if (!file) return;
    try {
      await transcribeVoice.mutateAsync(file);
    } catch {
      // transcribe errors handled
    }
  };

  const downloadAttachments = (commentId: string, fileIds: string[]) => {
    void (async () => {
      for (const fileId of fileIds) {
        try {
          await downloadAttachment.mutateAsync({
            chatId: commentId,
            fileId,
            fileName: `file-${fileId.slice(0, 8)}`,
          });
        } catch (error) {
          Alert.alert('Download File', (error as Error).message);
          break;
        }
      }
    })();
  };

  if (isHydrating || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // 1. TICKET LIST VIEW (When activeTicketId is null)
  if (!activeTicketId) {
    const rawList: TicketDTO[] = isOperator
      ? (staffTicketsQuery.data?.items ?? [])
      : (customerTicketsQuery.data?.items ?? []);
    const isListLoading = isOperator ? staffTicketsQuery.isLoading : customerTicketsQuery.isLoading;

    const filteredTickets = rawList.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.code?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    });

    return (
      <View style={[styles.root, { paddingTop: Math.max(insets.top, 8) }]}>
        {/* Floating Bubble List Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.bubbleHeaderIcon}>
              <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerMainTitle}>Support Requests</Text>
              <Text style={styles.headerSubTitle}>
                {user.role === 'CUSTOMER' ? 'Your ticket list' : 'Tickets awaiting action'}
              </Text>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color={Colors.textMute} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ticket code, title..."
              placeholderTextColor={Colors.textFaint}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textMute} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* List Content */}
        {isListLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredTickets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPadding}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => {
                  if (isOperator) void staffTicketsQuery.refetch();
                  else void customerTicketsQuery.refetch();
                }}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={44} color={Colors.textFaint} />
                <Text style={styles.emptyText}>No tickets yet</Text>
              </View>
            }
            renderItem={({ item }) =>
              isOperator ? (
                <StaffTicketCard
                  ticket={item}
                  onPress={() => {
                    setActiveTicketId(item.id);
                    setViewMode('chat');
                  }}
                />
              ) : (
                <TicketCard
                  ticket={item}
                  onPress={() => {
                    setActiveTicketId(item.id);
                    setViewMode('chat');
                  }}
                />
              )
            }
          />
        )}
      </View>
    );
  }

  // 2. ACTIVE TICKET VIEW (Chat & Details)
  const customerSendDisabled = !commentText.trim() && attachments.length === 0;
  const operatorSendDisabled = customerSendDisabled || operatorUploading || voiceRecorder.isRecording;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      // KeyboardAvoidingView from react-native-keyboard-controller, NOT RN's built-in one.
      // The app runs edge-to-edge (android.edgeToEdgeEnabled), so Android doesn't resize the
      // window for the keyboard; RN's version has to guess the offset → the composer jumps
      // up/down out of sync. This one reads the keyboard's real height and animation
      // progress, so one behavior works on both platforms with no manual offset.
      behavior="padding"
    >
      {/* Top Messenger Single-Row Compact Header Bar */}
      <View style={[styles.headerCompact, { paddingTop: Math.max(insets.top, 8) }]}>
        {/* Back Arrow -> Goes back to Ticket List */}
        <Pressable style={styles.backBtn} onPress={() => setActiveTicketId(null)} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>

        <View style={styles.headerInfoCompact}>
          <View style={styles.headerCodeRow}>
            <Text style={styles.headerCode}>{ticketDetail?.code || 'Ticket'}</Text>
            {ticketDetail?.status && <TicketStatusBadge status={ticketDetail.status} />}
          </View>
          {ticketDetail?.title ? (
            <Text style={styles.headerSubCompact} numberOfLines={1}>
              {ticketDetail.title}
            </Text>
          ) : null}
        </View>

        {/* Compact Inline Switch Pill in Header (Staff only, in Chat Mode) */}
        {isOperator && viewMode === 'chat' && (
          <View style={styles.headerTabSwitchInline}>
            <Pressable
              style={[styles.inlineSwitchBtn, chatTab === 'public' && styles.inlineSwitchBtnActivePublic]}
              onPress={() => setChatTab('public')}
            >
              <Ionicons
                name="earth"
                size={11}
                color={chatTab === 'public' ? Colors.primary : Colors.textMute}
              />
              <Text style={[styles.inlineSwitchText, chatTab === 'public' && styles.inlineSwitchTextActivePublic]}>
                {publicCount}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.inlineSwitchBtn, chatTab === 'internal' && styles.inlineSwitchBtnActiveInternal]}
              onPress={() => setChatTab('internal')}
            >
              <Ionicons
                name="lock-closed"
                size={10}
                color={chatTab === 'internal' ? Colors.warning : Colors.textMute}
              />
              <Text style={[styles.inlineSwitchText, chatTab === 'internal' && styles.inlineSwitchTextActiveInternal]}>
                {internalCount}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Info Toggle Button (Switches between Chat and Full Ticket Details) */}
        <Pressable
          style={styles.infoToggleBtn}
          onPress={() => setViewMode(viewMode === 'chat' ? 'details' : 'chat')}
          hitSlop={8}
        >
          <Ionicons
            name={viewMode === 'chat' ? 'information-circle-outline' : 'chatbubble-ellipses-outline'}
            size={22}
            color={Colors.primary}
          />
          {unreadCount > 0 && viewMode !== 'chat' && (
            <View style={styles.tinyBadgeDot} />
          )}
        </Pressable>
      </View>

      {/* CHAT MODE (Full height clean chat thread) */}
      {viewMode === 'chat' && (
        <View style={{ flex: 1 }}>
          <CommentThread
            comments={comments}
            currentUserId={accountId}
            imageHeaders={imageHeaders}
            onImagePress={setViewingImage}
            isLoading={commentsQuery.isLoading}
            hasNextPage={commentsQuery.hasNextPage}
            isFetchingNextPage={commentsQuery.isFetchingNextPage}
            onLoadMore={() => commentsQuery.fetchNextPage()}
            accentColor={isOperator ? Colors.primary : '#34C759'}
            showTabs={false}
            activeTab={chatTab}
            onTabChange={setChatTab}
            ticketClosed={chatLocked}
            pendingMessages={pendingChats}
            onRetryPending={retryPendingComment}
            onDiscardPending={discardPendingComment}
            onEdit={(comment, body, editReason) =>
              updateChat.mutate({ chatId: comment.id, payload: { body, editReason } })
            }
            onDelete={(comment, reason) => deleteChat.mutate({ chatId: comment.id, reason })}
            editPending={updateChat.isPending}
            deletePending={deleteChat.isPending}
            onMarkRead={(chatIds, onFailed) => markChatsRead.mutate({ chatIds, onFailed })}
            onTranslate={async (comment, targetLanguage) => {
              const response = await translateChat.mutateAsync({ chatId: comment.id, targetLanguage });
              return response.data.data ?? undefined;
            }}
            onPin={isOperator ? (comment) => pinChat.mutate(comment.id) : undefined}
            onUnpin={isOperator ? (comment) => unpinChat.mutate(comment.id) : undefined}
            pinningId={pinningId ?? null}
            onToggleReaction={(comment, type, isActive) =>
              isActive
                ? removeReaction.mutate({ chatId: comment.id, type })
                : addReaction.mutate({ chatId: comment.id, reactionType: type })
            }
            onDownloadAttachments={(comment, fileIds) => downloadAttachments(comment.id, fileIds)}
            aiSuggestions={aiSuggestions}
            onPickSuggestion={setCommentText}
            onDismissSuggestions={() => setAiSuggestions([])}
          />

          {!isOperator && attachments.length > 0 && (
            <View style={styles.attachmentList}>
              {attachments.map((attachment) => (
                <View key={attachment.fileId} style={styles.attachmentChip}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.fileName}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setAttachments((items) => items.filter((item) => item.fileId !== attachment.fileId))
                    }
                  >
                    <Text style={styles.attachmentRemove}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {isOperator && (
            <ChatAiToolbar
              ticketId={activeTicketId}
              disabled={chatLocked}
              onSuggestions={setAiSuggestions}
            />
          )}

          {!chatLocked && (
            <MentionSuggestionsPopup
              text={commentText}
              ticketId={activeTicketId}
              onSelectMention={(tag) =>
                setCommentText((text) => text.replace(/@([a-zA-Z0-9_.-]*)$/, `${tag} `))
              }
            />
          )}
          {!chatLocked && <TypingIndicator names={typingUsers.map((tUser) => tUser.displayName)} />}

          {/* Ticket đã xong → thay khu soạn tin bằng dòng read-only. */}
          {chatLocked && (
            <View style={styles.chatLockedBar}>
              <Ionicons name="lock-closed-outline" size={15} color={Colors.textMute} />
              <Text style={styles.chatLockedText}>
                Ticket has been closed — chat is read-only
              </Text>
            </View>
          )}

          {/* Composer */}
          {chatLocked ? null : isOperator ? (
            <View style={styles.operatorComposer}>
              <AttachmentPreviewStrip
                items={attachments}
                imageHeaders={imageHeaders}
                disabled={operatorUploading}
                onRemove={(fileId) =>
                  setAttachments((items) => items.filter((item) => item.fileId !== fileId))
                }
              />
              <View style={styles.composerRow}>
                <AttachmentPicker
                  compact
                  hideThumbnails
                  purpose={FilePurposeEnum.TicketAttachment}
                  value={attachments}
                  onChange={setAttachments}
                  onUploadingChange={setOperatorUploading}
                />
                <TextInput
                  style={styles.composerInput}
                  value={commentText}
                  onChangeText={(text) => {
                    setCommentText(text);
                    notifyTyping();
                  }}
                  placeholder={
                    chatTab === 'internal' ? 'Internal note (not visible to customer)...' : 'Type a message...'
                  }
                  placeholderTextColor={Colors.textFaint}
                  multiline
                  maxLength={1000}
                />
                <Pressable
                  style={styles.internalToggle}
                  onPress={handleStartVoice}
                  disabled={chatTab === 'internal' || operatorUploading || transcribeVoice.isPending}
                >
                  {transcribeVoice.isPending ? (
                    <ActivityIndicator size="small" color={Colors.textMute} />
                  ) : (
                    <Ionicons
                      name="mic-outline"
                      size={17}
                      color={chatTab === 'internal' ? Colors.textFaint : Colors.textMute}
                    />
                  )}
                </Pressable>
                <Pressable
                  style={[styles.sendBtn, operatorSendDisabled && styles.disabled]}
                  onPress={handleSend}
                  disabled={operatorSendDisabled}
                >
                  <Ionicons name="send" size={18} color="#FFF" />
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.composer}>
              <Pressable
                style={styles.composerIcon}
                onPress={handleCustomerPickAttachment}
                disabled={customerUpload.isPending}
              >
                {customerUpload.isPending ? (
                  <ActivityIndicator size="small" color={Colors.textMute} />
                ) : (
                  <Ionicons name="camera-outline" size={24} color={Colors.textMute} />
                )}
              </Pressable>
              <TextInput
                style={styles.composerInput}
                value={commentText}
                onChangeText={(text) => {
                  setCommentText(text);
                  notifyTyping();
                }}
                placeholder="Type a message..."
                placeholderTextColor={Colors.textFaint}
                multiline
                maxLength={1000}
              />
              <Pressable
                style={styles.composerIcon}
                onPress={handleStartVoice}
                disabled={customerUpload.isPending || transcribeVoice.isPending}
              >
                {transcribeVoice.isPending ? (
                  <ActivityIndicator size="small" color={Colors.textMute} />
                ) : (
                  <Ionicons name="mic-outline" size={22} color={Colors.textMute} />
                )}
              </Pressable>
              <Pressable
                style={[styles.sendBtn, customerSendDisabled && styles.disabled]}
                onPress={handleSend}
                disabled={customerSendDisabled}
              >
                <Ionicons name="send" size={18} color="#FFF" />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* DETAILS MODE (Contains complete Ticket Information, Timeline, Logs, KB articles) */}
      {viewMode === 'details' && (
        <View style={{ flex: 1 }}>
          {/* Sub-tabs bar inside Details view */}
          <View style={styles.subTabsBar}>
            <Pressable
              style={[styles.subTabItem, detailSubTab === 'details' && styles.subTabItemActive]}
              onPress={() => setDetailSubTab('details')}
            >
              <Text style={[styles.subTabLabel, detailSubTab === 'details' && styles.subTabLabelActive]}>
                Details
              </Text>
            </Pressable>

            <Pressable
              style={[styles.subTabItem, detailSubTab === 'activities' && styles.subTabItemActive]}
              onPress={() => setDetailSubTab('activities')}
            >
              <Text style={[styles.subTabLabel, detailSubTab === 'activities' && styles.subTabLabelActive]}>
                History
              </Text>
            </Pressable>

            {isOperator && (
              <Pressable
                style={[styles.subTabItem, detailSubTab === 'logs' && styles.subTabItemActive]}
                onPress={() => setDetailSubTab('logs')}
              >
                <Text style={[styles.subTabLabel, detailSubTab === 'logs' && styles.subTabLabelActive]}>
                  Logs
                </Text>
              </Pressable>
            )}

            {isOperator && (
              <Pressable
                style={[styles.subTabItem, detailSubTab === 'kb' && styles.subTabItemActive]}
                onPress={() => setDetailSubTab('kb')}
              >
                <Text style={[styles.subTabLabel, detailSubTab === 'kb' && styles.subTabLabelActive]}>
                  Guide
                </Text>
              </Pressable>
            )}
          </View>

          {/* Sub-Tab 1: Overview Details */}
          {detailSubTab === 'details' && (
            <ScrollView contentContainerStyle={styles.detailsScroll}>
              {ticketLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
              ) : ticketDetail ? (
                <>
                  {/* Ticket Overview Card with SLA countdown & Priority */}
                  <View style={[styles.detailCard, Shadow]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardCode}>{ticketDetail.code}</Text>
              {ticketDetail.slaTimer && shouldShowLiveSla(ticketDetail.status, ticketDetail.priority, ticketDetail.slaTimer.status) && <SlaCountdown sla={ticketDetail.slaTimer} />}
                    </View>
                    <Text style={styles.cardTitle}>{ticketDetail.title}</Text>

                    <View style={styles.metaGrid}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Status</Text>
                        <TicketStatusBadge status={ticketDetail.status} />
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Category</Text>
                        <Text style={styles.metaVal}>
                          {CATEGORY_LABEL[ticketDetail.category] ?? ticketDetail.category}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Priority</Text>
                        <Text style={styles.metaVal}>
                          {ticketDetail.priority
                            ? PRIORITY_LABEL[ticketDetail.priority] ?? ticketDetail.priority
                            : 'Not classified'}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Created</Text>
                        <Text style={styles.metaVal}>
                          {formatDate(ticketDetail.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  {ticketDetail.description ? (
                    <View style={[styles.detailCard, Shadow]}>
                      <Text style={styles.sectionTitle}>Issue Description</Text>
                      <Text style={styles.descriptionText}>{ticketDetail.description}</Text>
                    </View>
                  ) : null}

                  {/* Battery / Serial info if exists */}
                  {ticketDetail.batterySerialNumber && (
                    <View style={[styles.detailCard, Shadow]}>
                      <Text style={styles.sectionTitle}>Related Device</Text>
                      <View style={styles.assetRow}>
                        <Ionicons name="battery-charging" size={20} color={Colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.assetModel}>Lithium-Ion Battery</Text>
                          <Text style={styles.assetSerial}>
                            Battery code: {ticketDetail.batterySerialNumber}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Staff Action Bar / Customer Actions */}
                  {isOperator ? (
                    <View style={{ marginTop: 8 }}>
                      <TicketActionBar
                        status={ticketDetail.status}
                        onHold={() => setShowHold(true)}
                        onResume={() => resumeTicket.mutate({ reason: 'Blocking condition cleared.' })}
                        onResolve={() => setShowResolve(true)}
                        onEscalate={() => setShowEscalate(true)}
                        isLoading={
                      holdTicket.isPending ||
                          resumeTicket.isPending ||
                          resolveTicket.isPending ||
                          escalateTicket.isPending
                        }
                        canResolve={checkPermission(user, P.TICKET_RESOLVE) && canComplete(ticketDetail, accountId)}
                        canHold={canHold(ticketDetail, accountId)}
                        canResume={canResume(ticketDetail, accountId)}
                        canEscalate={canEscalate(ticketDetail, accountId)}
                      />
                    </View>
                  ) : (
                    <View style={styles.customerActionsRow}>
                  {ticketDetail.status === 'Closed' && canRateOrReopen(ticketDetail) && (
                        <Pressable style={styles.rateBtn} onPress={() => setShowRateModal(true)}>
                          <Ionicons name="star" size={16} color="#FFF" />
                          <Text style={styles.rateBtnText}>Rate Service</Text>
                        </Pressable>
                      )}
                      {canRateOrReopen(ticketDetail) && (
                        <Pressable style={styles.reopenBtn} onPress={() => setShowReopenModal(true)}>
                          <Ionicons name="refresh-circle" size={18} color={Colors.primary} />
                          <Text style={styles.reopenBtnText}>Request Reopen</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.emptyText}>Could not load ticket information.</Text>
              )}
            </ScrollView>
          )}

          {/* Sub-Tab 2: Activities Timeline */}
          {detailSubTab === 'activities' && (
            <ScrollView contentContainerStyle={styles.detailsScroll}>
              <ActivityTimeline
                activities={activitiesQuery.data}
                assignments={ticketDetail?.assignments}
                isLoading={activitiesQuery.isLoading}
              />
            </ScrollView>
          )}

          {/* Sub-Tab 3: Maintenance Logs (Staff Only) */}
          {detailSubTab === 'logs' && isOperator && (
            <ScrollView contentContainerStyle={styles.detailsScroll}>
              {ticketDetail?.status === 'InProgress' && isPrimaryHandler(ticketDetail, accountId) && <Pressable style={styles.addLogBtn} onPress={() => setShowLogForm(true)}>
                <Ionicons name="add-circle" size={18} color="#FFF" />
                <Text style={styles.addLogBtnText}>Add Maintenance Log</Text>
              </Pressable>}

              {ticketDetail?.maintenanceLogs && ticketDetail.maintenanceLogs.length > 0 ? (
                ticketDetail.maintenanceLogs.map((log) => (
                  <View key={log.id} style={[styles.detailCard, Shadow, { marginTop: 10 }]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.logTitle}>{log.summary || 'Maintenance Log'}</Text>
                      <Text style={styles.logTime}>
                        {formatDate(log.createdAt)}
                      </Text>
                    </View>
                    {log.actionsTaken ? (
                      <Text style={styles.descriptionText}>{log.actionsTaken}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { marginTop: 20 }]}>No maintenance logs yet.</Text>
              )}
            </ScrollView>
          )}

          {/* Sub-Tab 4: KB References (Staff Only) */}
          {detailSubTab === 'kb' && isOperator && (
            <ScrollView contentContainerStyle={styles.detailsScroll}>
              <Pressable style={styles.addLogBtn} onPress={() => setShowKbPicker(true)}>
                <Ionicons name="book" size={18} color="#FFF" />
                <Text style={styles.addLogBtnText}>Add guide reference</Text>
              </Pressable>

              {kbRefsQuery.data && kbRefsQuery.data.length > 0 ? (
                kbRefsQuery.data.map((ref) => (
                  <View key={ref.id} style={[styles.detailCard, Shadow, { marginTop: 10 }]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.logTitle}>{ref.kbArticleTitle || ref.kbArticleCode}</Text>
                      <Pressable onPress={() => removeKbRef.mutate(ref.id)}>
                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                      </Pressable>
                    </View>
                    <Text style={styles.metaLabel}>Article code: {ref.kbArticleCode}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { marginTop: 20 }]}>No referenced guide articles yet.</Text>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* Modals */}
      <VoiceRecordingModal
        visible={voiceRecorder.isRecording}
        elapsedSeconds={voiceRecorder.elapsedSeconds}
        level={voiceLevel}
        transcribing={transcribeVoice.isPending}
        onStop={handleStopVoice}
        onCancel={voiceRecorder.cancel}
      />

      {viewingImage !== null && (
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setViewingImage(null)}
        >
          <View style={styles.imageOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setViewingImage(null)} />
            <AuthImage fileId={viewingImage} style={styles.imageFull} resizeMode="contain" />
            <Pressable style={styles.imageClose} onPress={() => setViewingImage(null)} hitSlop={12}>
              <Ionicons name="close-circle" size={38} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>
        </Modal>
      )}

      {/* Staff Action Modals */}
      <HoldModal
        visible={showHold}
        isLoading={holdTicket.isPending}
        onClose={() => setShowHold(false)}
        onSubmit={async (reason: PauseReasonEnum, note: string, appointment: Date) => {
          await holdTicket.mutateAsync({ reason, note: note.trim(), rescheduledStartAt: appointment.toISOString() });
          setShowHold(false);
        }}
      />

      <ResolveModal
        visible={showResolve}
        isLoading={resolveTicket.isPending}
        onClose={() => setShowResolve(false)}
        onSubmit={async (summary: string) => {
          await resolveTicket.mutateAsync({ resolutionSummary: summary });
          setShowResolve(false);
        }}
      />

      <EscalateModal
        visible={showEscalate}
        isLoading={escalateTicket.isPending}
        onClose={() => setShowEscalate(false)}
        onSubmit={async (reason: EscalationReasonEnum, note: string) => {
          await escalateTicket.mutateAsync({ reason, note: note.trim() });
          setShowEscalate(false);
        }}
      />

      {showLogForm && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowLogForm(false);
            setEditingLog(null);
          }}
        >
          <View style={styles.imageOverlay}>
            <View style={{ width: '92%', maxHeight: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>{editingLog ? 'Edit Maintenance Log' : 'Add Maintenance Log'}</Text>
                <Pressable onPress={() => { setShowLogForm(false); setEditingLog(null); }}>
                  <Ionicons name="close" size={22} color={Colors.text} />
                </Pressable>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled">
                <MaintenanceLogForm
                  isLoading={addLog.isPending || updateLog.isPending}
                  initialValues={
                    editingLog
                      ? {
                          summary: editingLog.summary ?? '',
                          logType: editingLog.logType,
                          actionsTaken: editingLog.actionsTaken ?? '',
                          partsUsed: '',
                          durationMinutes: editingLog.durationMinutes,
                        }
                      : undefined
                  }
                  onSubmit={async (data: MaintenanceLogPayload) => {
                    if (editingLog) {
                      await updateLog.mutateAsync({
                        logId: editingLog.id,
                        data: data as UpdateMaintenanceLogPayload,
                      });
                      setShowLogForm(false);
                      setEditingLog(null);
                    } else {
                      await addLog.mutateAsync(data);
                      setShowLogForm(false);
                    }
                  }}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      <KbReferencePicker
        visible={showKbPicker}
        ticketId={targetId}
        onClose={() => setShowKbPicker(false)}
      />

      {/* Customer Modals */}
      <RateModal
        visible={showRateModal}
        isLoading={rateTicket.isPending}
        onClose={() => setShowRateModal(false)}
        onSubmit={(data: RatePayload) =>
          rateTicket.mutate(data, { onSuccess: () => setShowRateModal(false) })
        }
      />

      <ReopenModal
        visible={showReopenModal}
        isLoading={reopenTicket.isPending}
        onClose={() => setShowReopenModal(false)}
        onSubmit={(data: ReopenPayload) =>
          reopenTicket.mutate(data, { onSuccess: () => setShowReopenModal(false) })
        }
      />
    </KeyboardAvoidingView>
  );
}

export default function BubbleChatRoot(props: BubbleLaunchProps) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Its own KeyboardProvider: the bubble is a SEPARATE React root (own
            GestureHandlerRootView/SafeAreaProvider), so it does not inherit the one in
            app/_layout.tsx. Without it the KeyboardAvoidingView below has no keyboard data. */}
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <BubbleChat {...props} />
            </AuthProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: { color: Colors.textMute, fontSize: 14, textAlign: 'center' },
  listPadding: { padding: 12, paddingBottom: 30 },

  // List Header
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  bubbleHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubTitle: {
    fontSize: 12,
    color: Colors.textMute,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card2,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    padding: 0,
  },

  // Ultra-Compact Single-Line Active Header
  headerCompact: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    padding: 4,
    borderRadius: 8,
  },
  headerInfoCompact: {
    flex: 1,
    gap: 1,
  },
  headerCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerCode: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubCompact: {
    fontSize: 11,
    color: Colors.textMute,
    fontWeight: '500',
  },
  infoToggleBtn: {
    padding: 4,
    borderRadius: 8,
  },
  tinyBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.danger,
  },

  // Inline Switch inside top header bar
  headerTabSwitchInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card2,
    borderRadius: 12,
    padding: 2,
    gap: 2,
  },
  inlineSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  inlineSwitchBtnActivePublic: {
    backgroundColor: '#FFFFFF',
    ...Shadow,
  },
  inlineSwitchBtnActiveInternal: {
    backgroundColor: '#FFFFFF',
    ...Shadow,
  },
  inlineSwitchText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMute,
  },
  inlineSwitchTextActivePublic: {
    color: Colors.primary,
    fontWeight: '800',
  },
  inlineSwitchTextActiveInternal: {
    color: Colors.warning,
    fontWeight: '800',
  },

  // Sub-tabs inside Details view
  subTabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  subTabItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.card2,
  },
  subTabItemActive: {
    backgroundColor: Colors.primary + '18',
  },
  subTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMute,
  },
  subTabLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },

  // Details Tab Content
  detailsScroll: {
    padding: 12,
    gap: 10,
    paddingBottom: 30,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCode: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMute,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.textMute,
    fontWeight: '500',
  },
  metaVal: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assetModel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  assetSerial: {
    fontSize: 11,
    color: Colors.textMute,
  },

  customerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  rateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF9500',
    borderRadius: 14,
    paddingVertical: 10,
  },
  rateBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  reopenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card2,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 10,
  },
  reopenBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  addLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  addLogBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  logTime: {
    fontSize: 11,
    color: Colors.textMute,
  },

  // Composer styles
  chatLockedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: Colors.card2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  chatLockedText: { fontSize: 12.5, fontWeight: '600', color: Colors.textMute },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  operatorComposer: {
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  composerIcon: { padding: 6 },
  internalToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: Colors.card2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.35 },
  attachmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 6,
    backgroundColor: '#FFFFFF',
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: 180,
    backgroundColor: Colors.card2,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  attachmentName: { flex: 1, fontSize: 11, color: Colors.text, fontWeight: '500' },
  attachmentRemove: { fontSize: 11, color: Colors.textMute, fontWeight: '700' },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFull: { width: '100%', height: '80%' },
  imageClose: { position: 'absolute', right: 16, top: 16 },
});
