import { Linking, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import {
  NotificationDTO,
  NotificationTypeEnum,
} from '../features/notifications/types/notification.types';

export const CHANNEL_CRITICAL = 'alerts-critical';
export const CHANNEL_DEFAULT = 'alerts-default';
export const CHANNEL_CHAT = 'chat-messages';

const CRITICAL_TYPES = new Set<NotificationTypeEnum>([
  NotificationTypeEnum.EnvironmentalIncidentDetected,
  NotificationTypeEnum.IncidentDeclared,
  NotificationTypeEnum.BatteryAlertEscalationPending,
  NotificationTypeEnum.AlertTicketSagaFailed,
  NotificationTypeEnum.SlaBreached,
]);

const CHAT_TYPES = new Set<NotificationTypeEnum>([
  NotificationTypeEnum.ChatCreated,
  NotificationTypeEnum.ChatMentioned,
  NotificationTypeEnum.ChatReacted,
]);

interface LocalNotificationsNativeModule {
  ensureChannels(): Promise<boolean>;
  areEnabled(): Promise<boolean>;
  openSettings(): Promise<boolean>;
  presentNotification(
    notificationId: string,
    title: string,
    message: string,
    entityType: string | null,
    entityId: string | null,
    ticketId: string | null,
    critical: boolean,
  ): Promise<boolean>;
  presentChatBubble(
    notificationId: string,
    ticketId: string,
    title: string,
    message: string,
    senderName: string,
  ): Promise<boolean>;
}

const localNotifications = NativeModules.LocalNotifications as
  | LocalNotificationsNativeModule
  | undefined;


export const isCriticalType = (type: NotificationTypeEnum): boolean => CRITICAL_TYPES.has(type);

let channelsReady = false;

/** Creates all Android channels natively, including allowBubbles on the chat channel. */
export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android' || channelsReady || !localNotifications) return;
  await localNotifications.ensureChannels();
  channelsReady = true;
}

/** Requests Android 13+ notification permission without registering any remote push token. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || !localNotifications) return false;
  if (Number(Platform.Version) < 33) return localNotifications.areEnabled();

  try {
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    const alreadyGranted = await PermissionsAndroid.check(permission);
    if (alreadyGranted) return localNotifications.areEnabled();
    const result = await PermissionsAndroid.request(permission);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function openNotificationSettings(): Promise<void> {
  if (Platform.OS === 'android' && localNotifications) {
    try {
      await localNotifications.openSettings();
      return;
    } catch {
      // Fall through to the generic app settings page.
    }
  }
  await Linking.openSettings();
}

type SystemNotification = Pick<
  NotificationDTO,
  'id' | 'title' | 'body' | 'type' | 'payloadJson' | 'entityType' | 'entityId'
>;

function parsePayload(payloadJson: string | null | undefined): Record<string, unknown> {
  if (!payloadJson) return {};
  try {
    const value = JSON.parse(payloadJson) as unknown;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Presents one standard Android local notification through the native NotificationManager. */
export async function presentLocal(
  notification: SystemNotification,
  isCritical?: boolean,
): Promise<void> {
  if (Platform.OS !== 'android' || !localNotifications) return;
  const payload = parsePayload(notification.payloadJson);
  await localNotifications.presentNotification(
    notification.id,
    notification.title,
    notification.body,
    notification.entityType,
    notification.entityId,
    typeof payload.ticketId === 'string' ? payload.ticketId : null,
    isCritical ?? isCriticalType(notification.type),
  );
}

/** Chat becomes an Android conversation bubble; other events use a normal local banner. */
export async function presentSystemNotification(
  notification: SystemNotification,
  isCritical?: boolean,
): Promise<void> {
  if (Platform.OS !== 'android' || !localNotifications) return;

  if (CHAT_TYPES.has(notification.type)) {
    const payload = parsePayload(notification.payloadJson);
    const ticketId = typeof payload.ticketId === 'string' ? payload.ticketId : null;
    if (ticketId) {
      const senderName =
        typeof payload.senderName === 'string' && payload.senderName.trim()
          ? payload.senderName
          : notification.title;
      try {
        if (
          await localNotifications.presentChatBubble(
            notification.id,
            ticketId,
            notification.title,
            notification.body,
            senderName,
          )
        ) {
          return;
        }
      } catch {
        // Fall through to an ordinary notification if this Android build lacks bubble support.
      }
    }
  }

  await presentLocal(notification, isCritical);
}

/** Android launchers derive their badge from active notifications; no cloud badge API is used. */
export async function syncBadge(_count: number): Promise<void> {
  return;
}
