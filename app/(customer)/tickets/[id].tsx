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
import { HttpError } from '../../../src/lib/errors';
import { ActivityTimeline } from '../../../src/features/tickets/components/ActivityTimeline';
import { RateModal } from '../../../src/features/tickets/components/RateModal';
import { ReopenModal } from '../../../src/features/tickets/components/ReopenModal';
import { SlaCountdown } from '../../../src/features/tickets/components/SlaCountdown';
import { TicketStatusBadge } from '../../../src/features/tickets/components/TicketStatusBadge';
import { useAddComment } from '../../../src/features/tickets/hooks/useAddComment';
import { useRateTicket } from '../../../src/features/tickets/hooks/useRateTicket';
import { useReopenTicket } from '../../../src/features/tickets/hooks/useReopenTicket';
import { useUploadCommentAttachment } from '../../../src/features/tickets/hooks/useUploadCommentAttachment';
import { useTicketDetail } from '../../../src/features/tickets/hooks/useTicketDetail';
import { useAuthImageHeaders } from '../../../src/features/tickets/hooks/useAuthImageHeaders';
import { AttachmentForm, commentSchema } from '../../../src/features/tickets/schemas/comment.schema';
import { RatePayload, ReopenPayload, TicketDetailDTO, TicketStatusEnum, TicketAttachmentDTO } from '../../../src/features/tickets/types/ticket.types';
import { BASE_URL } from '../../../src/lib/axios';
import { ENDPOINTS } from '../../../src/lib/endpoints';
import { BadgeColors, Colors, Shadow, ShadowPrimary } from '../../../src/lib/theme';
import { useMyBatteryAssets } from '../../../src/features/batteries/hooks/useMyBatteryAssets';
import { BatteryAssetDto } from '../../../src/features/batteries/types/battery.types';

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

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_MAP[priority] ?? { label: priority, badge: 'p3' as const };
  const bc = BadgeColors[cfg.badge];
  return (
    <View style={[styles.badge, { backgroundColor: bc.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: bc.text }]} />
      <Text style={[styles.badgeLabel, { color: bc.text }]}>{cfg.label}</Text>
    </View>
  );
}

function ChatBubble({
  comment,
  imageHeaders,
  onImagePress,
}: {
  comment: NonNullable<TicketDetailDTO['comments']>[number];
  imageHeaders?: { Authorization: string };
  onImagePress?: (uri: string) => void;
}) {
  const isCustomer = comment.authorRole === 'Customer';
  const isSystem = comment.authorRole === 'System';
  const fileIds = comment.attachmentFileIds ?? [];

  if (isSystem) {
    return (
      <View style={styles.systemMsg}>
        <Text style={styles.systemMsgText}>{comment.body}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubble, isCustomer ? styles.bubbleUser : styles.bubbleStaff, Shadow]}>
      <View style={styles.bubbleHeader}>
        <Text style={[styles.bubbleAuthor, isCustomer && { color: '#fff' }]}>
          {comment.authorDisplayName ?? comment.authorRole}
        </Text>
        <Text style={[styles.bubbleTime, isCustomer && { color: 'rgba(255,255,255,0.7)' }]}>
          {new Date(comment.createdAt).toLocaleString('vi-VN')}
        </Text>
      </View>
      {!!comment.body && (
        <Text style={[styles.bubbleBody, isCustomer && { color: '#fff' }]}>{comment.body}</Text>
      )}
      {fileIds.length > 0 && (
        <View style={styles.bubbleImages}>
          {fileIds.map((fid, i) => {
            const uri = `${BASE_URL}${ENDPOINTS.FILES.DOWNLOAD(fid)}`;
            return (
              <Pressable key={fid ?? `img-${i}`} onPress={() => onImagePress?.(uri)}>
                <Image
                  source={{ uri, headers: imageHeaders }}
                  style={styles.bubbleImageThumb}
                  resizeMode="cover"
                />
              </Pressable>
            );
          })}
        </View>
      )}
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
    if (st === 'Approved') return 1;
    return 0; // New or Open
  };

  const activeIndex = getActiveStepIndex(status);

  return (
    <View style={[styles.stepperContainer, Shadow]}>
      <Text style={styles.stepperTitle}>Tiến độ xử lý</Text>
      <View style={styles.stepperRow}>
        {STEP_CONFIGS.map((step, idx) => {
          const isActive = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          const isLast = idx === STEP_CONFIGS.length - 1;

          return (
            <View key={step.key} style={styles.stepItemCol}>
              <View style={styles.circleRow}>
                <View style={[styles.stepLine, idx === 0 && styles.invisibleLine, isActive && styles.stepLineActive]} />
                <View
                  style={[
                    styles.stepCircle,
                    isActive && styles.stepCircleActive,
                    isCurrent && styles.stepCircleCurrent,
                  ]}
                >
                  {isCurrent ? (
                    <Ionicons name="play" size={10} color="#fff" />
                  ) : isActive ? (
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  ) : (
                    <View style={styles.inactiveInnerDot} />
                  )}
                </View>
                <View style={[styles.stepLine, isLast && styles.invisibleLine, idx < activeIndex && styles.stepLineActive]} />
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]} numberOfLines={1}>
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
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ticket, isLoading, isError, refetch } = useTicketDetail(id ?? '');
  const imageHeaders = useAuthImageHeaders();

  const { data: batteries = [] } = useMyBatteryAssets();
  const { mutateAsync: addComment,      isPending: isCommenting  } = useAddComment(id ?? '');
  const { mutateAsync: rateTicket,      isPending: isRating      } = useRateTicket(id ?? '');
  const { mutateAsync: reopenTicket,    isPending: isReopening   } = useReopenTicket(id ?? '');
  const { mutateAsync: uploadAttachment, isPending: isUploading  } = useUploadCommentAttachment();

  const [commentText,     setCommentText]     = useState('');
  const [commentError,    setCommentError]    = useState('');
  const [attachments,     setAttachments]     = useState<AttachmentForm[]>([]);
  const [showRateModal,   setShowRateModal]   = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [activeTab,       setActiveTab]       = useState<'info' | 'chat'>('info');
  const [viewingImage,    setViewingImage]    = useState<string | null>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [activeTab]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF5E13" size="large" />
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

  const comments = (ticket.comments ?? []).filter((c) => !c.isInternal);

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

  const handleRemoveAttachment = (fileId: string) => {
    setAttachments((prev) => prev.filter((a) => a.fileId !== fileId));
  };

  const handleSendComment = async () => {
    setCommentError('');
    const result = commentSchema.safeParse({ body: commentText, attachments });
    if (!result.success) {
      setCommentError(result.error.flatten().fieldErrors.body?.[0] ?? 'Nội dung không hợp lệ');
      return;
    }
    try {
      await addComment({ body: result.data.body, attachments: result.data.attachments });
      setCommentText('');
      setAttachments([]);
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi bình luận. Vui lòng thử lại.');
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.topCode} numberOfLines={1}>{ticket.code}</Text>
        <Pressable style={[styles.moreBtn, Shadow]}>
          <Ionicons name="ellipsis-horizontal" size={16} color={Colors.text} />
        </Pressable>
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
          {comments.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{comments.length}</Text>
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
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {new Date(ticket.createdAt).toLocaleString('vi-VN')} · {CATEGORY_LABEL[ticket.category] ?? ticket.category}
              </Text>
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
            <View style={[styles.batteryIconBg, { backgroundColor: '#FFE5DA' }]}>
              <Ionicons name="battery-charging" size={18} color="#FF5E13" />
            </View>
            <View style={styles.batteryLinkInfo}>
              <Text style={styles.batteryLinkTitle}>
                {battery ? battery.batteryTypeName : `Thiết bị ${ticket.batteryAssetId ? '...' : 'Chưa liên kết'}`}
              </Text>
              <Text style={styles.batteryLinkSub}>
                {battery ? battery.serialNumber : ''}{battery?.siteName ? ` · ${battery.siteName}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
          </Pressable>

          {/* Assignment info row */}
          {(() => {
            const assignActivity = ticket.activities?.find((a) => a.action === 'StaffAssigned' || a.action === 'StaffReassigned');
            const staffName = ticket.assignedStaffName ?? ticket.assignedStaffId;
            if (!staffName && !assignActivity) return null;
            return (
              <View style={[styles.assignCard, Shadow]}>
                <View style={styles.assignRow}>
                  <View style={styles.assignIconWrap}>
                    <Ionicons name="person-outline" size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.assignInfo}>
                    <Text style={styles.assignLabel}>Kỹ thuật viên</Text>
                    <Text style={styles.assignValue}>
                      {ticket.assignedStaffName ?? (ticket.assignedStaffId ? 'Đã phân công' : 'Chưa phân công')}
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
                          {' · '}{new Date(assignActivity.createdAt).toLocaleString('vi-VN')}
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

              {/* Attachments — only shown when there are real files from API */}
              {(ticket.attachments?.length ?? 0) > 0 && (
                <>
                  <Text style={[styles.sectionH, { marginTop: 14, marginBottom: 8 }]}>Ảnh đính kèm</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachRow}>
                    {(ticket.attachments as TicketAttachmentDTO[]).map((att, i) => {
                      const uri = `${BASE_URL}${ENDPOINTS.FILES.DOWNLOAD(att.fileId)}`;
                      return (
                        <Pressable key={att.id ?? `att-${i}`} style={styles.attachCard} onPress={() => setViewingImage(uri)}>
                          <Image
                            source={{ uri, headers: imageHeaders }}
                            style={styles.attachImage}
                          />
                        </Pressable>
                      );
                    })}
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

          {/* Historical activities timeline */}
          {(ticket.activities?.length ?? 0) > 0 && (
            <View style={[styles.timelineCard, Shadow]}>
              <Text style={styles.sectionH}>Lịch sử hoạt động</Text>
              <ActivityTimeline activities={ticket.activities!} />
            </View>
          )}
        </ScrollView>
      )}

      {/* Chat tab — messenger style */}
      {activeTab === 'chat' && (
        <View style={styles.chatContainer}>
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
          >
            {comments.length === 0 ? (
              <View style={styles.chatEmpty}>
                <Ionicons name="chatbubbles-outline" size={36} color={Colors.textFaint} />
                <Text style={styles.chatEmptyText}>Chưa có trao đổi nào.</Text>
              </View>
            ) : (
              <View style={styles.chatList}>
                {comments.map((c, i) => (
                  <ChatBubble
                    key={c.id ?? `comment-${i}`}
                    comment={c}
                    imageHeaders={imageHeaders}
                    onImagePress={setViewingImage}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Attachment chips */}
          {attachments.length > 0 && (
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

          {commentError ? (
            <View style={styles.composerError}>
              <Text style={styles.fieldError}>{commentError}</Text>
            </View>
          ) : null}

          {/* Composer bar */}
          <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
            <Pressable style={styles.composerIcon} onPress={handlePickAttachment} disabled={isUploading}>
              {isUploading
                ? <ActivityIndicator size="small" color={Colors.textMute} />
                : <Ionicons name="camera-outline" size={20} color={Colors.textMute} />}
            </Pressable>
            <TextInput
              style={styles.composerInput}
              value={commentText}
              onChangeText={(t) => { setCommentText(t); setCommentError(''); }}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={Colors.textFaint}
              multiline
              maxLength={1000}
            />
            <Pressable
              style={[styles.sendBtn, (!commentText.trim() || isCommenting) && styles.btnDisabled]}
              onPress={handleSendComment}
              disabled={!commentText.trim() || isCommenting}
            >
              {isCommenting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="send" size={16} color="#fff" />}
            </Pressable>
          </View>
        </View>
      )}

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
  root:           { flex: 1, backgroundColor: Colors.bg },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, gap: 10 },
  errorMsg:       { color: Colors.textMute, fontSize: 14, marginTop: 4 },
  retryBtn:       { backgroundColor: '#FF5E13', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
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
    borderBottomColor: '#FF5E13',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMute,
  },
  tabTextActive: {
    color: '#FF5E13',
    fontWeight: '800',
  },
  tabBadge: {
    backgroundColor: '#FF5E13',
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
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 8,
    paddingBottom: 8,
  },
  chatEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  chatEmptyText: {
    color: Colors.textFaint,
    fontSize: 14,
    fontWeight: '500',
  },

  scroll:         { padding: 20, gap: 14, paddingBottom: 40 },

  titleCard:      { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  badgeRow:       { flexDirection: 'row', gap: 8 },
  badge:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeDot:       { width: 6, height: 6, borderRadius: 3 },
  badgeLabel:     { fontSize: 11, fontWeight: '700' },
  title:          { fontSize: 18, fontWeight: '800', color: Colors.text, lineHeight: 26, letterSpacing: -0.3 },
  metaRow:        { flexDirection: 'row', alignItems: 'center' },
  metaText:       { fontSize: 12, color: Colors.textMute, fontWeight: '600' },

  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  stepperTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
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
    backgroundColor: '#EDECE8',
  },
  stepLineActive: {
    backgroundColor: '#FF5E13',
  },
  invisibleLine: {
    backgroundColor: 'transparent',
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EDECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#FF5E13',
  },
  stepCircleCurrent: {
    backgroundColor: '#FF5E13',
    borderWidth: 2,
    borderColor: '#FFE5DA',
  },
  inactiveInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BFBDB4',
  },
  stepLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: Colors.textMute,
    marginTop: 8,
    textAlign: 'center',
  },
  stepLabelActive: {
    fontWeight: '800',
    color: '#FF5E13',
  },

  waitBanner:     {
    backgroundColor: Colors.stWaiting, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12,
  },
  waitText:       { color: '#fff', fontSize: 13, fontWeight: '700' },

  batteryLinkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
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

  assignCard:     { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  assignRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  assignIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  assignInfo:     { flex: 1 },
  assignLabel:    { fontSize: 11, color: Colors.textMute, fontWeight: '500', marginBottom: 2 },
  assignValue:    { fontSize: 13, color: Colors.text, fontWeight: '700' },
  assignTime:     { fontSize: 11, color: Colors.textMute, fontWeight: '400' },
  descCard:       { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  sectionH:       { fontSize: 14, fontWeight: '800', color: Colors.text },
  descText:       { fontSize: 13, color: Colors.text2, lineHeight: 22, fontWeight: '500' },
  attachRow:      { gap: 8 },
  attachCard:     {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  attachImage:    {
    width: '100%',
    height: '100%',
  },

  resolvedCard:   {
    backgroundColor: '#E8F5E9', borderRadius: 24,
    padding: 16, alignItems: 'center', flexDirection: 'row', gap: 12,
  },
  resolvedTitle:  { fontSize: 14, fontWeight: '800', color: '#2F7A2F' },
  resolvedSub:    { fontSize: 11, color: '#2F7A2F', opacity: 0.8, marginTop: 2 },

  actionCard:     { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  rateBtn:        {
    backgroundColor: '#FF5E13', borderRadius: 16,
    padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  actionBtnText:  { color: '#fff', fontWeight: '800', fontSize: 14 },
  reopenLink:     { alignItems: 'center' },
  reopenLinkText: { color: '#FF5E13', fontSize: 13, fontWeight: '700' },

  closedCard:     {
    backgroundColor: Colors.card2, borderRadius: 24,
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  closedText:     { fontSize: 13, fontWeight: '700', color: Colors.textMute },

  timelineCard:   { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },

  commentsCard:   { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  chatList:       { gap: 10 },
  emptyText:      { color: Colors.textFaint, fontSize: 13, textAlign: 'center', paddingVertical: 8 },

  systemMsg:      { alignItems: 'center', paddingVertical: 4 },
  systemMsgText:  { fontSize: 11, color: Colors.textMute, fontStyle: 'italic', fontWeight: '600' },

  bubble:         { borderRadius: 20, padding: 14, maxWidth: '85%' },
  bubbleUser:     { backgroundColor: '#FF5E13', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleStaff:    { backgroundColor: Colors.card2, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleHeader:   { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  bubbleAuthor:   { fontSize: 11, fontWeight: '800', color: Colors.text },
  bubbleTime:     { fontSize: 10, color: Colors.textMute },
  bubbleBody:     { fontSize: 13, color: Colors.text, lineHeight: 20, fontWeight: '500' },

  composer:       {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 14, paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.02)',
  },
  composerIcon:   { padding: 8, paddingBottom: 10 },
  composerInput:  {
    flex: 1, backgroundColor: Colors.card2, borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 9,
    fontSize: 13, color: Colors.text,
    maxHeight: 100,
  },
  sendBtn:        {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FF5E13',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  btnDisabled:    { opacity: 0.35 },
  composerError:  { backgroundColor: '#FFFFFF', paddingHorizontal: 18 },
  fieldError:     { color: Colors.danger, fontSize: 12 },

  attachmentList:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingTop: 8, backgroundColor: '#FFFFFF' },
  attachmentChip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card2, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 5, maxWidth: 200 },
  attachmentChipIcon: { fontSize: 12 },
  attachmentName:     { flex: 1, fontSize: 12, color: Colors.text, fontWeight: '500' },
  attachmentRemove:   { fontSize: 12, color: Colors.textMute, fontWeight: '700', marginLeft: 2 },

  bubbleImages:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  bubbleImageThumb: { width: 150, height: 110, borderRadius: 10 },

  imgOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', alignItems: 'center', justifyContent: 'center' },
  imgFull:     { width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.78 },
  imgCloseBtn: { position: 'absolute', right: 16 },
});
