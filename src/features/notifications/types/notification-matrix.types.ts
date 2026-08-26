// Notification preference matrix by category × channel (Sprint 6.3 NOTI3-04).
// Shape matches BE `NotificationPreferenceMatrixDto.cs` and web `notification-matrix.types.ts`.
import { NotificationCategoryEnum } from '../enums/notification.enum';
import { NotificationPreferenceDto } from './notification-preference.types';

/**
 * One category row in the matrix.
 *
 * `isCustomized = false` ⇒ the 4 channel values are **inherited** from the global toggle (`channels`),
 * the user hasn't set this category explicitly. The UI must distinguish "inherited" from "set explicitly",
 * otherwise the user would think they've customized it when no record actually exists.
 */
export interface NotificationCategoryPreferenceDto {
  category: NotificationCategoryEnum;
  categoryName: string; // "Ticket" | "Sla" | ... — returned by BE, no need for a client-side lookup table
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  isCustomized: boolean;
}

/** GET /api/notification-preferences/matrix — `categories` ALWAYS has 6 elements, sorted by enum 1→6. */
export interface NotificationPreferenceMatrixDto {
  channels: NotificationPreferenceDto; // global toggle — still WINS over every category row
  categories: NotificationCategoryPreferenceDto[];
}

/**
 * PUT /api/notification-preferences/matrix — **patches per row**: only the category present in `items` is changed.
 *
 * ⚠️ But each row must send **all 4 channels**: "patch" is per CATEGORY, not per individual channel cell.
 * Leaving `emailEnabled` out means BE writes `false`, not keeping the old value.
 */
export interface NotificationCategoryPreferenceItem {
  category: NotificationCategoryEnum;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
}

export interface UpdateNotificationMatrixPayload {
  items: NotificationCategoryPreferenceItem[];
}

/**
 * GET /api/notification-preferences/categories — type → category lookup table.
 * Element count is decided by BE, **do not hardcode** it client-side.
 */
export interface NotificationCategoryMapDto {
  type: string;
  typeValue: number;
  category: string;
  categoryValue: number;
}
