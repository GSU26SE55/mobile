import * as ImagePicker from 'expo-image-picker';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
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
import { useUploadCommentAttachment } from '../../../src/features/tickets/hooks/useUploadCommentAttachment';
import { useAuthImageHeaders } from '../../../src/features/tickets/hooks/useAuthImageHeaders';
import { AttachmentForm } from '../../../src/features/tickets/schemas/comment.schema';
import { HoldReasonEnum, MaintenanceLogPayload } from '../../../src/features/staff/types/staff.types';
import { EscalationReasonEnum, TicketStatusEnum, TicketCommentDTO } from '../../../src/features/tickets/types/ticket.types';
import { BASE_URL } from '../../../src/lib/axios';
import { ENDPOINTS } from '../../../src/lib/endpoints';
import { useSessionStore } from '../../../src/stores/sessionStore';

type TabKey = 'comments' | 'activities' | 'logs';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'comments',   label: 'Trao đổi',  icon: 'chatbubbles-outline' },
  { key: 'activities', label: 'Lịch sử',   icon: 'time-outline' },
  { key: 'logs',       label: 'Nhật ký',    icon: 'document-text-outline' },
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

const ROLE_AVATAR: Record<string, { icon: keyof typeof Ionicons.glyphMap; iconColor: string; bg: string }> = {
  System:   { icon: 'server-outline',  iconColor: Colors.info,        bg: Colors.infoLight },
  Customer: { icon: 'person-outline',  iconColor: Colors.warningDark, bg: Colors.warningLight },
  Manager:  { icon: 'briefcase-outline', iconColor: Colors.primaryDark, bg: Colors.primaryLight },
  Staff:    { icon: 'shield-outline',  iconColor: Colors.primaryDark, bg: Colors.primaryLight },
};

function ChatBubble({
  comment,
  isMe,
  imageHeaders,
  onImagePress,
}: {
  comment: TicketCommentDTO;
  isMe: boolean;
  imageHeaders?: { Authorization: string };
  onImagePress?: (uri: string) => void;
}) {
  const avatar = ROLE_AVATAR[comment.authorRole] ?? ROLE_AVATAR.Staff;
  const displayName =
    isMe ? 'Bạn' :
    comment.authorDisplayName ??
    (comment.authorRole === 'System' ? 'Hệ thống' :
     comment.authorRole === 'Customer' ? 'Khách hàng' :
     comment.authorRole === 'Manager' ? 'Manager' : 'Nhân viên');

  const fileIds = comment.attachmentFileIds ?? [];

  if (comment.authorRole === 'System') {
    return (
      <View style={styles.systemMsg}>
        <Text style={styles.systemMsgText}>{comment.body}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      {!isMe && (
        <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
          <Ionicons name={avatar.icon} size={14} color={avatar.iconColor} />
        </View>
      )}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {!isMe && <Text style={styles.bubbleName}>{displayName}</Text>}
        {!!comment.body && (
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{comment.body}</Text>
        )}
        {fileIds.length > 0 && (
          <View style={styles.bubbleImages}>
            {fileIds.map((fid, i) => {
              const uri = `${BASE_URL}${ENDPOINTS.FILES.DOWNLOAD(fid)}`;
              return (
                <Pressable key={fid ?? `img-${i}`} onPress={() => onImagePress?.(uri)}>
                  <Image
                    source={{ uri, headers: imageHeaders }}
                    style={styles.bubbleImage}
                    resizeMode="cover"
                  />
                </Pressable>
              );
            })}
          </View>
        )}
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
          {new Date(comment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

export default function StaffTicketDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticketId = id ?? '';
  const accountId = useSessionStore((s) => s.user?.accountId);
  const { data: ticket, isLoading, isError, refetch } = useStaffTicketDetail(ticketId);
  const imageHeaders = useAuthImageHeaders();
  const { mutate: startTicket, isPending: isStarting } = useStartTicket(ticketId);
  const { mutate: holdTicket, isPending: isHolding } = useHoldTicket(ticketId);
  const { mutate: resumeTicket, isPending: isResuming } = useResumeTicket(ticketId);
  const { mutate: resolveTicket, isPending: isResolving } = useResolveTicket(ticketId);
  const { mutate: escalateTicket, isPending: isEscalating } = useEscalateTicket(ticketId);
  const { mutate: addComment, isPending: isSending } = useStaffAddComment(ticketId);
  const { mutate: addLog, isPending: isAddingLog } = useAddMaintenanceLog(ticketId);
  const { mutateAsync: uploadAttachment, isPending: isUploading } = useUploadCommentAttachment();

  const [activeTab, setActiveTab] = useState<TabKey>('comments');
  const [commentText, setCommentText] = useState('');
  const [attachments, setAttachments] = useState<AttachmentForm[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showHold, setShowHold] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (activeTab === 'comments') {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [activeTab, ticket?.comments?.length]);
  const isActioning = isStarting || isHolding || isResuming || isResolving || isEscalating;

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
    if (!trimmed && attachments.length === 0) return;
    addComment(
      { body: trimmed, isInternal: false, attachments: attachments.length > 0 ? attachments : undefined },
      { onSuccess: () => { setCommentText(''); setAttachments([]); } },
    );
  };

  const handleStart = () => { startTicket(undefined); };
  const handleHold = (reason: HoldReasonEnum) => { holdTicket({ reason }, { onSuccess: () => setShowHold(false) }); };
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
      <View style={styles.loadingRoot}>
        <Ionicons name="alert-circle-outline" size={36} color={Colors.textFaint} />
        <Text style={styles.errorMsg}>Không thể tải ticket.</Text>
        <Pressable style={[styles.retryBtn, ShadowPrimary]} onPress={() => refetch()}>
          <Text style={styles.retryText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const pColor = PRIORITY_COLORS[ticket.priority] ?? PRIORITY_COLORS.P3Normal;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerCode}>{ticket.code}</Text>
          <TicketStatusBadge status={ticket.status} />
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (activeTab === 'comments') scrollRef.current?.scrollToEnd({ animated: true });
        }}
      >
        {/* Title + Priority + SLA */}
        <View style={[styles.card, Shadow]}>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.priorityBadge, { backgroundColor: pColor.bg }]}>
              <Text style={[styles.priorityText, { color: pColor.text }]}>{PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</Text>
            </View>
            <Text style={styles.metaCategory}>{ticket.category}</Text>
          </View>
          {ticket.slaTimer && <SlaCountdown sla={ticket.slaTimer} />}
        </View>

        {/* Description */}
        {ticket.description && (
          <View style={[styles.card, Shadow]}>
            <Text style={styles.sectionLabel}>Mô tả</Text>
            <Text style={styles.descText}>{ticket.description}</Text>
          </View>
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

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? Colors.primary : Colors.textMute} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'comments' && (
          <View style={styles.chatSection}>
            {(ticket.comments ?? []).length === 0 ? (
              <Text style={styles.emptyTab}>Chưa có trao đổi nào</Text>
            ) : (
              (ticket.comments ?? []).filter((c) => !c.isInternal).map((c, i) => (
                <ChatBubble
                  key={c.id ?? `comment-${i}`}
                  comment={c}
                  isMe={!!accountId && c.authorUserId === accountId}
                  imageHeaders={imageHeaders}
                  onImagePress={setViewingImage}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'activities' && (
          <View style={styles.tabContent}>
            <ActivityTimeline activities={ticket.activities ?? []} />
          </View>
        )}

        {activeTab === 'logs' && (
          <View style={styles.tabContent}>
            {(ticket.maintenanceLogs ?? []).length === 0 ? (
              <Text style={styles.emptyTab}>Chưa có nhật ký bảo trì</Text>
            ) : (
              (ticket.maintenanceLogs ?? []).map((log: any, idx: number) => (
                <View key={log.id ?? idx} style={[styles.logCard, Shadow]}>
                  {!!log.description && <Text style={styles.logDesc}>{log.description}</Text>}
                  {!!log.actionTaken && <Text style={styles.logMeta}>Hành động: {log.actionTaken}</Text>}
                  {!!log.partsUsed && <Text style={styles.logMeta}>Phụ tùng: {log.partsUsed}</Text>}
                  {log.durationMinutes != null && <Text style={styles.logMeta}>Thời gian: {log.durationMinutes} phút</Text>}
                  {!!log.createdAt && <Text style={styles.logTime}>{new Date(log.createdAt).toLocaleString('vi-VN')}</Text>}
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Comment Composer — only for comments tab */}
      {activeTab === 'comments' && (
        <View style={styles.composerWrap}>
          {attachments.length > 0 && (
            <View style={styles.attachmentList}>
              {attachments.map((a, i) => (
                <View key={a.fileId ?? `a-${i}`} style={styles.attachmentChip}>
                  <Ionicons name="image-outline" size={14} color={Colors.primary} />
                  <Text style={styles.attachmentName} numberOfLines={1}>{a.fileName}</Text>
                  <Pressable onPress={() => handleRemoveAttachment(a.fileId)} hitSlop={10}>
                    <Ionicons name="close-circle" size={16} color={Colors.textMute} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
            <Pressable style={styles.composerIcon} onPress={handlePickImage} disabled={isUploading}>
              {isUploading
                ? <ActivityIndicator size="small" color={Colors.textMute} />
                : <Ionicons name="camera-outline" size={22} color={Colors.textMute} />}
            </Pressable>
            <TextInput
              style={styles.composerInput}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={Colors.textFaint}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, (!commentText.trim() && attachments.length === 0 || isSending) && styles.sendBtnDisabled]}
              onPress={handleSendComment}
              disabled={(!commentText.trim() && attachments.length === 0) || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFF" />
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* Modals */}
      <HoldModal visible={showHold} onClose={() => setShowHold(false)} onSubmit={handleHold} isLoading={isHolding} />
      <ResolveModal visible={showResolve} onClose={() => setShowResolve(false)} onSubmit={handleResolve} isLoading={isResolving} />
      <EscalateModal visible={showEscalate} onClose={() => setShowEscalate(false)} onSubmit={handleEscalate} isLoading={isEscalating} />

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
            <Image
              source={{ uri: viewingImage, headers: imageHeaders ?? undefined }}
              style={styles.imgFull}
              resizeMode="contain"
            />
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
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerCode: { fontSize: 16, fontWeight: '800', color: Colors.text },

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

  chatSection: { gap: 8 },
  tabContent: { gap: 10 },
  emptyTab: { textAlign: 'center', fontSize: 13, color: Colors.textFaint, fontWeight: '600', paddingVertical: 24 },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowMe: { flexDirection: 'row-reverse' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleName: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 3 },
  bubbleText: { fontSize: 13, fontWeight: '500', color: Colors.text, lineHeight: 19 },
  bubbleTextMe: { color: '#FFFFFF' },
  bubbleTime: { fontSize: 10, color: Colors.textFaint, marginTop: 4, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.6)' },

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
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 10,
  },
  composerIcon: { padding: 6, paddingBottom: 8 },
  composerInput: {
    flex: 1, minHeight: 40, maxHeight: 100,
    backgroundColor: Colors.card2, borderRadius: 20,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    fontSize: 14, color: Colors.text, fontWeight: '500',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...ShadowPrimary,
  },
  sendBtnDisabled: { backgroundColor: Colors.textFaint, shadowOpacity: 0 },

  systemMsg: { alignItems: 'center', paddingVertical: 4 },
  systemMsgText: { fontSize: 11, color: Colors.textMute, fontStyle: 'italic', fontWeight: '600' },

  bubbleImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  bubbleImage: { width: 160, height: 120, borderRadius: 10 },

  errorMsg: { color: Colors.textMute, fontSize: 14, marginTop: 8 },
  retryBtn: {
    backgroundColor: Colors.primary, borderRadius: 16,
    paddingHorizontal: 24, paddingVertical: 10, marginTop: 8,
  },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  imgOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', alignItems: 'center', justifyContent: 'center' },
  imgFull:     { width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.78 },
  imgCloseBtn: { position: 'absolute', right: 16 },
});
