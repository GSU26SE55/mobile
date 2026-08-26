import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDateTime } from '@/src/lib/date';
import { Colors, Shadow } from '@/src/lib/theme';
import { NotificationTypeEnum } from '../enums/notification.enum';
import { isUnread, NotificationDTO } from '../types/notification.types';

type IconSpec = { name: keyof typeof Ionicons.glyphMap; color: string };

const ICON_MAP: Partial<Record<NotificationTypeEnum, IconSpec>> = {
  [NotificationTypeEnum.TicketCreated]:                 { name: 'add-circle-outline',         color: Colors.info },
  [NotificationTypeEnum.TicketAssigned]:                { name: 'person-add-outline',         color: Colors.info },
  [NotificationTypeEnum.TicketStatusChanged]:           { name: 'swap-horizontal-outline',    color: Colors.stProgress },
  [NotificationTypeEnum.TicketResolved]:                { name: 'checkmark-circle-outline',   color: Colors.success },
  [NotificationTypeEnum.TicketClosed]:                  { name: 'lock-closed-outline',        color: Colors.textMute },
  [NotificationTypeEnum.TicketEscalated]:               { name: 'arrow-up-circle-outline',    color: Colors.stEscalated },
  [NotificationTypeEnum.SlaWarning]:                    { name: 'warning-outline',            color: Colors.warning },
  [NotificationTypeEnum.SlaBreached]:                   { name: 'alert-circle-outline',       color: Colors.danger },
  [NotificationTypeEnum.BatteryAnomalyDetected]:        { name: 'battery-dead-outline',       color: Colors.danger },
  [NotificationTypeEnum.EnvironmentalIncidentDetected]: { name: 'thermometer-outline',        color: Colors.danger },
  [NotificationTypeEnum.EnvironmentalIncidentResolved]: { name: 'leaf-outline',               color: Colors.success },
  [NotificationTypeEnum.AccountActivated]:              { name: 'checkmark-done-outline',     color: Colors.success },
  [NotificationTypeEnum.IncidentDeclared]:              { name: 'alert-outline',              color: Colors.danger },
  [NotificationTypeEnum.CascadeRiskHigh]:               { name: 'git-branch-outline',         color: Colors.danger },
  [NotificationTypeEnum.BatteryAlertEscalationPending]: { name: 'time-outline',               color: Colors.warning },
  [NotificationTypeEnum.AlertTicketSagaFailed]:         { name: 'bug-outline',                color: Colors.danger },
  [NotificationTypeEnum.IotDeviceWentOffline]:          { name: 'cloud-offline-outline',      color: Colors.textMute },
  // GH-83 — 16 types synced from Sprint 6.2/6.3; previously all of them fell through to FALLBACK_ICON.
  [NotificationTypeEnum.ChatCreated]:                    { name: 'chatbubble-outline',         color: Colors.info },
  [NotificationTypeEnum.ChatMentioned]:                  { name: 'at-outline',                 color: Colors.primary },
  [NotificationTypeEnum.ChatReacted]:                    { name: 'heart-outline',              color: Colors.stProgress },
  [NotificationTypeEnum.ParticipantAdded]:               { name: 'person-add-outline',         color: Colors.success },
  [NotificationTypeEnum.ParticipantRemoved]:             { name: 'person-remove-outline',      color: Colors.textMute },
  [NotificationTypeEnum.ParticipantRoleChanged]:         { name: 'swap-horizontal-outline',    color: Colors.info },
  [NotificationTypeEnum.BlogGenerationCompleted]:        { name: 'document-text-outline',      color: Colors.success },
  [NotificationTypeEnum.BlogGenerationFailed]:           { name: 'document-outline',           color: Colors.danger },
  [NotificationTypeEnum.ChatEscalatedToAdmin]:           { name: 'arrow-up-circle-outline',    color: Colors.stEscalated },
  [NotificationTypeEnum.TicketApproved]:                 { name: 'checkmark-circle-outline',   color: Colors.success },
  [NotificationTypeEnum.TicketRejected]:                 { name: 'close-circle-outline',       color: Colors.danger },
  [NotificationTypeEnum.TicketReopened]:                 { name: 'refresh-outline',            color: Colors.warning },
  [NotificationTypeEnum.TicketRatingRequested]:          { name: 'star-outline',               color: Colors.warning },
  [NotificationTypeEnum.BatteryAnomalyWarning]:          { name: 'battery-half-outline',       color: Colors.warning },
  [NotificationTypeEnum.BatteryAnomalyInfo]:             { name: 'battery-full-outline',       color: Colors.info },
  [NotificationTypeEnum.TicketMerged]:                   { name: 'git-merge-outline',          color: Colors.info },
  // 35–39 — shipped on the BE but missing from the client enum until now, so they all fell
  // through to FALLBACK_ICON regardless of what they meant.
  [NotificationTypeEnum.SlaAutoResumed]:                 { name: 'play-circle-outline',        color: Colors.stProgress },
  [NotificationTypeEnum.IotDeviceRecovered]:             { name: 'wifi-outline',               color: Colors.success },
  [NotificationTypeEnum.IotDeviceAutoDecommissioned]:    { name: 'close-circle-outline',       color: Colors.danger },
  [NotificationTypeEnum.TicketWorkStarted]:              { name: 'construct-outline',          color: Colors.stProgress },
  [NotificationTypeEnum.TicketScheduleChanged]:          { name: 'calendar-outline',           color: Colors.warning },
  [NotificationTypeEnum.PeriodicMaintenanceReminder]:    { name: 'calendar-number-outline',    color: Colors.warning },
  [NotificationTypeEnum.PeriodicMaintenanceScheduleChanged]: { name: 'calendar-outline',       color: Colors.success },
  [NotificationTypeEnum.System]:                        { name: 'information-circle-outline', color: Colors.info },
};

const FALLBACK_ICON: IconSpec = { name: 'information-circle-outline', color: Colors.info };

interface Props {
  notification: NotificationDTO;
  onPress: () => void;
}

export function NotificationCard({ notification, onPress }: Props) {
  const icon = ICON_MAP[notification.type] ?? FALLBACK_ICON;
  const unread = isUnread(notification);

  return (
    <Pressable
      style={[styles.card, Shadow, unread && styles.cardUnread]}
      onPress={onPress}
    >
      <View style={[styles.iconBg, { backgroundColor: `${icon.color}15` }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
        <Text style={styles.time}>{formatDateTime(notification.createdAt)}</Text>
      </View>
      {/* Ô chứa dot luôn được render để cột nội dung có cùng chiều rộng ở dòng đã đọc
          và chưa đọc — nếu ẩn cả ô thì `gap` biến mất và title bị nhảy ngang. */}
      <View style={styles.unreadDotSlot}>
        {unread && <View style={styles.unreadDot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    // 'flex-start' chứ không phải 'center': body có thể 1 hoặc 2 dòng nên chiều cao card
    // thay đổi, căn giữa làm icon của các dòng lệch nhau khi cuộn danh sách.
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  // Unread stays inside the app's cream/yellow family: a warm tint plus a yellow-tinted border.
  // The previous mint (#F8FFF8) was the only green surface on a cream screen and read as a bug.
  // Colour is not the only unread signal — the title also goes bold and the dot appears — so the
  // softer tint costs nothing in legibility.
  cardUnread: {
    backgroundColor: Colors.primaryLight,
    borderColor: 'rgba(217,160,0,0.22)',
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // giữ nguyên kích thước khi title dài
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  titleUnread: {
    fontWeight: '800',
  },
  body: {
    fontSize: 12,
    color: Colors.textMute,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: Colors.textFaint,
    fontWeight: '500',
    marginTop: 2,
  },
  unreadDotSlot: {
    width: 8,
    flexShrink: 0,
    alignItems: 'center',
    // căn chấm về giữa dòng title thay vì đỉnh card
    paddingTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    // primaryDark, not primary: a #FFD500 dot on the cream card is nearly invisible.
    backgroundColor: Colors.primaryDark,
  },
});
