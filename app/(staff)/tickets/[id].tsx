import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { MaintenanceLogPayload } from '../../../src/features/staff/types/staff.types';
import { EscalationReasonEnum, PauseReasonEnum, TicketStatusEnum, TicketCommentDTO } from '../../../src/features/tickets/types/ticket.types';
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

function ChatBubble({ comment, isMe }: { comment: TicketCommentDTO; isMe: boolean }) {
  const avatar = ROLE_AVATAR[comment.authorRole] ?? ROLE_AVATAR.Staff;
  const displayName =
    isMe ? 'Bạn' :
    comment.authorDisplayName ??
    (comment.authorRole === 'System' ? 'Hệ thống' :
     comment.authorRole === 'Customer' ? 'Khách hàng' :
     comment.authorRole === 'Manager' ? 'Manager' : 'Nhân viên');

  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      {!isMe && (
        <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
          <Ionicons name={avatar.icon} size={14} color={avatar.iconColor} />
        </View>
      )}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {!isMe && <Text style={styles.bubbleName}>{displayName}</Text>}
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{comment.body}</Text>
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
  const { data: apiDetail, isLoading } = useStaffTicketDetail(ticketId);
  const { mutate: startTicket, isPending: isStarting } = useStartTicket(ticketId);
  const { mutate: holdTicket, isPending: isHolding } = useHoldTicket(ticketId);
  const { mutate: resumeTicket, isPending: isResuming } = useResumeTicket(ticketId);
  const { mutate: resolveTicket, isPending: isResolving } = useResolveTicket(ticketId);
  const { mutate: escalateTicket, isPending: isEscalating } = useEscalateTicket(ticketId);
  const { mutate: addComment, isPending: isSending } = useStaffAddComment(ticketId);
  const { mutate: addLog, isPending: isAddingLog } = useAddMaintenanceLog(ticketId);

  const [activeTab, setActiveTab] = useState<TabKey>('comments');
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [showHold, setShowHold] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (activeTab === 'comments') {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [activeTab, apiDetail?.comments?.length]);

  const handleSendComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addComment(
      { body: trimmed, isInternal: isInternalComment },
      { onSuccess: () => setCommentText('') },
    );
  };

  const handleStart = () => { startTicket(undefined); };
  const handleHold = (reason: PauseReasonEnum, note?: string) => { holdTicket({ reason, note }, { onSuccess: () => setShowHold(false) }); };
  const handleResume = () => { resumeTicket(undefined); };
  const handleResolve = (summary: string) => { resolveTicket({ resolutionSummary: summary }, { onSuccess: () => setShowResolve(false) }); };
  const handleEscalate = (reason: EscalationReasonEnum, note?: string) => { escalateTicket({ reason, note }, { onSuccess: () => setShowEscalate(false) }); };
  const handleAddLog = (log: MaintenanceLogPayload) => { addLog(log, { onSuccess: () => setShowLogForm(false) }); };

  if (isLoading && !apiDetail) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!apiDetail) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textFaint} />
        <Text style={styles.notFoundTitle}>Không tải được ticket</Text>
        <Text style={styles.notFoundText}>
          Ticket không tồn tại hoặc bạn không có quyền xem. Vui lòng thử lại.
        </Text>
        <Pressable style={styles.notFoundBtn} onPress={() => router.back()}>
          <Text style={styles.notFoundBtnText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const ticket = apiDetail;
  const pColor = PRIORITY_COLORS[ticket.priority] ?? PRIORITY_COLORS.P3Normal;
  const isActioning = isStarting || isHolding || isResuming || isResolving || isEscalating;

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
            {(ticket.comments ?? []).map((c) => (
              <ChatBubble key={c.id} comment={c} isMe={!!accountId && c.authorUserId === accountId} />
            ))}
            {(ticket.comments ?? []).length === 0 && (
              <Text style={styles.emptyTab}>Chưa có trao đổi nào</Text>
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
              (ticket.maintenanceLogs ?? []).map((log) => (
                <View key={log.id} style={[styles.logCard, Shadow]}>
                  {!!log.summary && <Text style={styles.logDesc}>{log.summary}</Text>}
                  {!!log.actionsTaken && <Text style={styles.logMeta}>Hành động: {log.actionsTaken}</Text>}
                  {!!log.diagnosisDetails && <Text style={styles.logMeta}>Chẩn đoán: {log.diagnosisDetails}</Text>}
                  {!!log.resolutionNote && <Text style={styles.logMeta}>Kết quả: {log.resolutionNote}</Text>}
                  {log.durationMinutes > 0 && <Text style={styles.logMeta}>Thời gian: {log.durationMinutes} phút</Text>}
                  <Text style={styles.logTime}>{new Date(log.createdAt).toLocaleString('vi-VN')}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Comment Composer — only for comments tab */}
      {activeTab === 'comments' && (
        <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable
            style={[styles.internalToggle, isInternalComment && styles.internalToggleOn]}
            onPress={() => setIsInternalComment((v) => !v)}
          >
            <Ionicons
              name={isInternalComment ? 'lock-closed' : 'lock-open-outline'}
              size={16}
              color={isInternalComment ? Colors.warningDark : Colors.textMute}
            />
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
            style={[styles.sendBtn, (!commentText.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={handleSendComment}
            disabled={!commentText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFF" />
            )}
          </Pressable>
        </View>
      )}

      {/* Modals */}
      <HoldModal visible={showHold} onClose={() => setShowHold(false)} onSubmit={handleHold} isLoading={isHolding} />
      <ResolveModal visible={showResolve} onClose={() => setShowResolve(false)} onSubmit={handleResolve} isLoading={isResolving} />
      <EscalateModal visible={showEscalate} onClose={() => setShowEscalate(false)} onSubmit={handleEscalate} isLoading={isEscalating} />
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

  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: Colors.border,
  },
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
  internalToggle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card2,
    alignItems: 'center', justifyContent: 'center',
  },
  internalToggleOn: { backgroundColor: Colors.warningLight },
});
