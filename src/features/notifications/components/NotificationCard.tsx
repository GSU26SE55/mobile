import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadow } from '../../../lib/theme';
import { NotificationDTO, NotificationTypeEnum } from '../types/notification.types';

const ICON_MAP: Record<NotificationTypeEnum, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  TicketAssigned:      { name: 'person-add-outline',     color: Colors.info },
  TicketStatusChanged: { name: 'swap-horizontal-outline', color: Colors.stProgress },
  TicketCommented:     { name: 'chatbubble-outline',      color: Colors.primary },
  SlaWarning:          { name: 'warning-outline',         color: Colors.warning },
  SlaBreach:           { name: 'alert-circle-outline',    color: Colors.danger },
  TicketEscalated:     { name: 'arrow-up-circle-outline', color: Colors.stEscalated },
  TicketResolved:      { name: 'checkmark-circle-outline', color: Colors.success },
  TicketReopened:      { name: 'refresh-outline',         color: Colors.stWaiting },
  SystemAlert:         { name: 'information-circle-outline', color: Colors.info },
};

interface Props {
  notification: NotificationDTO;
  onPress: () => void;
}

export function NotificationCard({ notification, onPress }: Props) {
  const icon = ICON_MAP[notification.type] ?? ICON_MAP.SystemAlert;

  return (
    <Pressable
      style={[styles.card, Shadow, !notification.isRead && styles.cardUnread]}
      onPress={onPress}
    >
      <View style={[styles.iconBg, { backgroundColor: `${icon.color}15` }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !notification.isRead && styles.titleUnread]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
        <Text style={styles.time}>
          {new Date(notification.createdAt).toLocaleString('vi-VN')}
        </Text>
      </View>
      {!notification.isRead && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardUnread: {
    backgroundColor: '#F8FFF8',
    borderColor: Colors.primaryLight,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
