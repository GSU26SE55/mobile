import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HttpError } from '../../../src/lib/errors';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import { AttachmentForm, commentSchema } from '../../../src/features/tickets/schemas/comment.schema';
import {
  RatePayload,
  ReopenPayload,
  TicketDetailDTO,
} from '../../../src/features/tickets/types/ticket.types';

const PRIORITY_LABEL: Record<string, string> = {
  P1Critical: 'P1 · Khẩn cấp',
  P2High:     'P2 · Cao',
  P3Normal:   'P3 · Thường',
};

const CATEGORY_LABEL: Record<string, string> = {
  Charging:    'Sạc pin',
  Overheat:    'Quá nhiệt',
  NoPower:     'Mất điện',
  Performance: 'Hiệu suất',
  Repair:      'Sửa chữa',
  Other:       'Khác',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function CommentList({ ticket }: { ticket: TicketDetailDTO }) {
  const comments = (ticket.comments ?? []).filter((c) => !c.isInternal);
  if (comments.length === 0) {
    return <Text style={styles.emptyText}>Chưa có bình luận nào.</Text>;
  }
  return (
    <View style={styles.commentList}>
      {comments.map((c) => (
        <View key={c.id} style={styles.commentItem}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>
              {c.authorDisplayName ?? c.authorRole}
            </Text>
            <Text style={styles.commentTime}>
              {new Date(c.createdAt).toLocaleString('vi-VN')}
            </Text>
          </View>
          <Text style={styles.commentBody}>{c.body}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ticket, isLoading, isError, refetch } = useTicketDetail(id ?? '');

  const { mutateAsync: addComment,      isPending: isCommenting  } = useAddComment(id ?? '');
  const { mutateAsync: rateTicket,      isPending: isRating      } = useRateTicket(id ?? '');
  const { mutateAsync: reopenTicket,    isPending: isReopening   } = useReopenTicket(id ?? '');
  const { mutateAsync: uploadAttachment, isPending: isUploading  } = useUploadCommentAttachment();

  const [commentText,     setCommentText]     = useState('');
  const [commentError,    setCommentError]    = useState('');
  const [attachments,     setAttachments]     = useState<AttachmentForm[]>([]);
  const [showRateModal,   setShowRateModal]   = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1976D2" />
      </View>
    );
  }

  if (isError || !ticket) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không thể tải ticket.</Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const canRate   = ticket.status === 'ClosedPendingRate';
  const canReopen = ticket.status === 'ClosedPendingRate';

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

  return (
    <SafeAreaView style={styles.root}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Quay lại</Text>
        </Pressable>
        <Text style={styles.topCode} numberOfLines={1}>{ticket.code}</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.card}>
          <Text style={styles.title}>{ticket.title}</Text>
          <View style={styles.badgeRow}>
            <TicketStatusBadge status={ticket.status} />
          </View>
          {ticket.slaTimer && <SlaCountdown sla={ticket.slaTimer} />}
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin</Text>
          <InfoRow label="Danh mục"  value={CATEGORY_LABEL[ticket.category] ?? ticket.category} />
          <InfoRow label="Ưu tiên"   value={PRIORITY_LABEL[ticket.priority] ?? ticket.priority} />
          <InfoRow label="Nguồn gốc" value={ticket.origin === 'AutoFromAlert' ? 'Tự động từ cảnh báo' : ticket.origin === 'ManualByCustomer' ? 'Khách hàng tạo' : 'Staff tạo'} />
          <InfoRow label="Ngày tạo"  value={new Date(ticket.createdAt).toLocaleString('vi-VN')} />
          {ticket.reopenCount > 0 && (
            <InfoRow label="Mở lại" value={`${ticket.reopenCount} lần`} />
          )}
          {ticket.rating != null && (
            <InfoRow label="Đánh giá" value={`${'★'.repeat(ticket.rating)}${'☆'.repeat(5 - ticket.rating)}`} />
          )}
        </View>

        {/* Description */}
        {ticket.description ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.description}>{ticket.description}</Text>
          </View>
        ) : null}

        {/* Resolution */}
        {ticket.resolutionSummary ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Kết quả xử lý</Text>
            <Text style={styles.description}>{ticket.resolutionSummary}</Text>
          </View>
        ) : null}

        {/* Actions */}
        {(canRate || canReopen) && (
          <View style={[styles.card, styles.actionRow]}>
            {canRate && (
              <Pressable style={styles.actionBtn} onPress={() => setShowRateModal(true)}>
                <Text style={styles.actionBtnText}>★ Đánh giá</Text>
              </Pressable>
            )}
            {canReopen && (
              <Pressable style={[styles.actionBtn, styles.reopenBtn]} onPress={() => setShowReopenModal(true)}>
                <Text style={styles.actionBtnText}>↺ Mở lại</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Comments */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bình luận</Text>
          <CommentList ticket={ticket} />

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

          {/* Input box */}
          <View style={[styles.commentBox, commentError ? styles.commentBoxError : null]}>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={(t) => { setCommentText(t); setCommentError(''); }}
              placeholder="Thêm bình luận..."
              placeholderTextColor="#B0B8C4"
              multiline
              maxLength={1000}
            />
            <View style={styles.commentToolbar}>
              <Pressable
                style={styles.attachBtn}
                onPress={handlePickAttachment}
                disabled={isUploading}
              >
                {isUploading
                  ? <ActivityIndicator color="#1976D2" size="small" />
                  : <Text style={styles.attachBtnText}>📎</Text>
                }
              </Pressable>
              <Pressable
                style={[styles.sendBtn, (!commentText.trim() || isCommenting || isUploading) && styles.btnDisabled]}
                onPress={handleSendComment}
                disabled={!commentText.trim() || isCommenting || isUploading}
              >
                {isCommenting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.sendBtnText}>Gửi</Text>
                }
              </Pressable>
            </View>
          </View>
          {commentError ? <Text style={styles.fieldError}>{commentError}</Text> : null}
        </View>

        {/* Timeline */}
        {(ticket.activities?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lịch sử hoạt động</Text>
            <ActivityTimeline activities={ticket.activities!} />
          </View>
        )}
      </ScrollView>

      <RateModal
        visible={showRateModal}
        isLoading={isRating}
        onClose={() => setShowRateModal(false)}
        onSubmit={handleRate}
      />
      <ReopenModal
        visible={showReopenModal}
        isLoading={isReopening}
        onClose={() => setShowReopenModal(false)}
        onSubmit={handleReopen}
      />
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#F5F7FA' },
  flex:           { flex: 1 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText:      { color: '#666', fontSize: 15 },
  retryBtn:       { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: '#1976D2' },
  retryText:      { color: '#fff', fontWeight: '600' },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn:        { width: 80 },
  backText:       { color: '#1976D2', fontSize: 15, fontWeight: '600' },
  topCode:        { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#333' },
  scroll:         { padding: 12, gap: 12, paddingBottom: 40 },
  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  title:          { fontSize: 17, fontWeight: '700', color: '#111', lineHeight: 24 },
  badgeRow:       { flexDirection: 'row', gap: 8 },
  sectionTitle:   { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 2 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel:      { fontSize: 13, color: '#666' },
  infoValue:      { fontSize: 13, color: '#111', fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 8 },
  description:    { fontSize: 14, color: '#333', lineHeight: 22 },
  actionRow:      { flexDirection: 'row', gap: 12 },
  actionBtn:      { flex: 1, backgroundColor: '#1976D2', padding: 13, borderRadius: 10, alignItems: 'center' },
  reopenBtn:      { backgroundColor: '#E53935' },
  actionBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  commentList:    { gap: 12 },
  emptyText:      { color: '#999', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  commentItem:    { backgroundColor: '#F5F7FA', borderRadius: 8, padding: 12, gap: 4 },
  commentHeader:  { flexDirection: 'row', justifyContent: 'space-between' },
  commentAuthor:  { fontSize: 12, fontWeight: '600', color: '#333' },
  commentTime:    { fontSize: 11, color: '#AAA' },
  commentBody:    { fontSize: 13, color: '#444', lineHeight: 20 },
  attachmentList:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  attachmentChip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDF2FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 5, maxWidth: 200 },
  attachmentChipIcon: { fontSize: 12 },
  attachmentName:     { flex: 1, fontSize: 12, color: '#1976D2', fontWeight: '500' },
  attachmentRemove:   { fontSize: 12, color: '#90A4AE', fontWeight: '700', marginLeft: 2 },
  commentBox:         { borderWidth: 1, borderColor: '#E0E6EF', borderRadius: 12, backgroundColor: '#FAFBFD', overflow: 'hidden' },
  commentBoxError:    { borderColor: '#E53935' },
  commentInput:       { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, fontSize: 14, color: '#222', minHeight: 64, maxHeight: 120, textAlignVertical: 'top' },
  commentToolbar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEF1F6', backgroundColor: '#F5F7FA' },
  attachBtn:          { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  attachBtnText:      { fontSize: 18 },
  sendBtn:            { backgroundColor: '#1976D2', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnDisabled:        { opacity: 0.45 },
  sendBtnText:        { color: '#fff', fontWeight: '700', fontSize: 13 },
  fieldError:         { color: '#E53935', fontSize: 12, marginTop: 4 },
});
