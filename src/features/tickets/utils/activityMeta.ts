import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/lib/theme';

// Shared ticket-activity timeline metadata: labels, colors, and icons are grouped
// semantically, making an activity recognizable from its color without reading a raw enum.
// Mirrors the web app, using Ionicons and React Native theme tokens.
//
// Color groups:
//   ok    (green)  — successful completion or approval
//   p1    (red)    — breach, incident, or rejection
//   p2    (orange) — warning, escalation, or reopening
//   info  (blue)   — creation, status change, assignment, or comment
//   muted (gray)   — paused SLA or system activity

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

// The key is a string because the backend can return actions outside the frontend enum.
const ACTIVITY_META: Record<string, ActivityMeta> = {
  Created:                  { label: 'Ticket created',              tone: 'info',  icon: 'add-circle-outline' },
  StatusChanged:            { label: 'Status changed',              tone: 'info',  icon: 'sync-outline' },
  PriorityAssigned:         { label: 'Priority assigned',           tone: 'info',  icon: 'flag-outline' },
  StaffAssigned:            { label: 'Staff assigned',              tone: 'info',  icon: 'person-add-outline' },
  StaffReassigned:          { label: 'Staff reassigned',            tone: 'info',  icon: 'people-outline' },
  Commented:                { label: 'Messaged',                    tone: 'info',  icon: 'chatbubble-outline' },
  Chatted:                  { label: 'Messaged',                    tone: 'info',  icon: 'chatbubble-outline' },
  ChatEdited:               { label: 'Message edited',              tone: 'info',  icon: 'chatbubble-outline' },
  ChatDeleted:              { label: 'Message deleted',             tone: 'muted', icon: 'chatbubble-outline' },
  ChatFlagged:              { label: 'Message flagged',             tone: 'p1',    icon: 'shield-outline' },
  MaintenanceLogged:        { label: 'Maintenance logged',          tone: 'info',  icon: 'construct-outline' },
  AttachmentAdded:          { label: 'Attachment added',            tone: 'info',  icon: 'attach-outline' },
  SlaPaused:                { label: 'SLA paused',                  tone: 'muted', icon: 'pause-circle-outline' },
  SlaResumed:               { label: 'SLA resumed',                 tone: 'info',  icon: 'play-circle-outline' },
  SlaWarning:               { label: 'SLA warning',                 tone: 'p2',    icon: 'warning-outline' },
  SlaBreached:              { label: 'SLA breached',                tone: 'p1',    icon: 'alarm-outline' },
  EscalationRequested:      { label: 'Escalation requested',        tone: 'p2',    icon: 'arrow-up-circle-outline' },
  Escalated:                { label: 'Escalated',                   tone: 'p2',    icon: 'arrow-up-circle-outline' },
  IncidentDeclared:         { label: 'Incident declared',           tone: 'p1',    icon: 'alert-circle-outline' },
  Resolved:                 { label: 'Resolved',                    tone: 'ok',    icon: 'checkmark-circle-outline' },
  Approved:                 { label: 'Approved',                    tone: 'ok',    icon: 'checkmark-done-circle-outline' },
  TriageApproved:           { label: 'Triage approved',             tone: 'ok',    icon: 'checkmark-done-circle-outline' },
  Rejected:                 { label: 'Rejected',                    tone: 'p1',    icon: 'close-circle-outline' },
  Rated:                    { label: 'Customer rated',              tone: 'info',  icon: 'star-outline' },
  Reopened:                 { label: 'Ticket reopened',             tone: 'p2',    icon: 'arrow-undo-outline' },
  AutoClosed:               { label: 'Automatically closed',       tone: 'muted', icon: 'lock-closed-outline' },
  ResolvedByEscalatedStaff: { label: 'Resolved after escalation',   tone: 'ok',    icon: 'checkmark-circle-outline' },
  Closed:                   { label: 'Ticket closed',               tone: 'muted', icon: 'lock-closed-outline' },
};

const FALLBACK: ActivityMeta = { label: 'Activity', tone: 'muted', icon: 'ellipse-outline' };

export function getActivityMeta(action: string): ActivityMeta {
  return ACTIVITY_META[action] ?? { ...FALLBACK, label: action };
}

export function activityToneStyle(tone: ActivityTone) {
  return TONE_STYLE[tone];
}
