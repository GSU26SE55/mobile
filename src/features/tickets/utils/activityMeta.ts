import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/lib/theme';

// Meta dùng chung cho timeline hoạt động ticket: label tiếng Việt + màu + icon
// theo NHÓM ngữ nghĩa, để phân biệt loại nhanh bằng màu thay vì đọc tên enum thô.
// Mirror Web (shared/components/common/ticketActivityMeta.tsx) — icon đổi sang
// Ionicons, màu đổi sang Colors token của theme.ts (RN không có CSS var).
//
// Nhóm màu:
//   ok    (xanh lá) — hoàn thành / phê duyệt tích cực
//   p1    (đỏ)      — nghiêm trọng: breach, incident, từ chối
//   p2    (cam)     — cảnh báo / chuyển cấp / mở lại
//   info  (xanh dương) — thao tác thông tin: tạo, đổi trạng thái, gán, bình luận
//   muted (xám)     — SLA tạm dừng / hệ thống

type ActivityTone = 'ok' | 'p1' | 'p2' | 'info' | 'muted';

export interface ActivityMeta {
  label: string;
  tone: ActivityTone;
  icon: keyof typeof Ionicons.glyphMap;
}

const TONE_STYLE: Record<ActivityTone, { dot: string; iconColor: string; bg: string }> = {
  ok:    { dot: Colors.success, iconColor: Colors.successDark, bg: Colors.successLight },
  p1:    { dot: Colors.danger,  iconColor: Colors.dangerDark,  bg: Colors.dangerLight },
  p2:    { dot: Colors.warning, iconColor: Colors.warningDark, bg: Colors.warningLight },
  info:  { dot: Colors.info,    iconColor: Colors.infoDark,    bg: Colors.infoLight },
  muted: { dot: Colors.gray,    iconColor: Colors.textMute,    bg: Colors.card2 },
};

// Key là string vì BE có thể trả action ngoài enum FE.
const ACTIVITY_META: Record<string, ActivityMeta> = {
  Created:                  { label: 'Tạo ticket',              tone: 'info',  icon: 'add-circle-outline' },
  StatusChanged:            { label: 'Đổi trạng thái',          tone: 'info',  icon: 'sync-outline' },
  PriorityAssigned:         { label: 'Gán mức ưu tiên',         tone: 'info',  icon: 'flag-outline' },
  StaffAssigned:            { label: 'Gán nhân viên',           tone: 'info',  icon: 'person-add-outline' },
  StaffReassigned:          { label: 'Điều chuyển nhân viên',   tone: 'info',  icon: 'people-outline' },
  Commented:                { label: 'Bình luận',               tone: 'info',  icon: 'chatbubble-outline' },
  Chatted:                  { label: 'Bình luận',               tone: 'info',  icon: 'chatbubble-outline' },
  ChatEdited:               { label: 'Sửa bình luận',           tone: 'info',  icon: 'chatbubble-outline' },
  ChatDeleted:              { label: 'Xoá bình luận',           tone: 'muted', icon: 'chatbubble-outline' },
  ChatFlagged:              { label: 'Bình luận bị gắn cờ',     tone: 'p1',    icon: 'shield-outline' },
  MaintenanceLogged:        { label: 'Ghi nhật ký bảo trì',     tone: 'info',  icon: 'construct-outline' },
  AttachmentAdded:          { label: 'Đính kèm tệp',            tone: 'info',  icon: 'attach-outline' },
  SlaPaused:                { label: 'Tạm dừng SLA',            tone: 'muted', icon: 'pause-circle-outline' },
  SlaResumed:               { label: 'Tiếp tục SLA',            tone: 'info',  icon: 'play-circle-outline' },
  SlaWarning:               { label: 'Cảnh báo SLA',            tone: 'p2',    icon: 'warning-outline' },
  SlaBreached:              { label: 'Vi phạm SLA',             tone: 'p1',    icon: 'alarm-outline' },
  EscalationRequested:      { label: 'Yêu cầu chuyển cấp',      tone: 'p2',    icon: 'arrow-up-circle-outline' },
  Escalated:                { label: 'Đã chuyển cấp',           tone: 'p2',    icon: 'arrow-up-circle-outline' },
  IncidentDeclared:         { label: 'Khai báo sự cố',          tone: 'p1',    icon: 'alert-circle-outline' },
  Resolved:                 { label: 'Báo hoàn thành',          tone: 'ok',    icon: 'checkmark-circle-outline' },
  Approved:                 { label: 'Phê duyệt',               tone: 'ok',    icon: 'checkmark-done-circle-outline' },
  TriageApproved:           { label: 'Duyệt phân loại',         tone: 'ok',    icon: 'checkmark-done-circle-outline' },
  Rejected:                 { label: 'Từ chối',                 tone: 'p1',    icon: 'close-circle-outline' },
  Rated:                    { label: 'Khách đánh giá',          tone: 'info',  icon: 'star-outline' },
  Reopened:                 { label: 'Mở lại ticket',           tone: 'p2',    icon: 'arrow-undo-outline' },
  AutoClosed:               { label: 'Tự động đóng',            tone: 'muted', icon: 'lock-closed-outline' },
  ResolvedByEscalatedStaff: { label: 'Giải quyết sau chuyển cấp', tone: 'ok',  icon: 'checkmark-circle-outline' },
  Closed:                   { label: 'Đã đóng ticket',          tone: 'muted', icon: 'lock-closed-outline' },
};

const FALLBACK: ActivityMeta = { label: 'Hoạt động', tone: 'muted', icon: 'ellipse-outline' };

export function getActivityMeta(action: string): ActivityMeta {
  return ACTIVITY_META[action] ?? { ...FALLBACK, label: action };
}

export function activityToneStyle(tone: ActivityTone) {
  return TONE_STYLE[tone];
}
