import { UserRole } from '@/src/shared/enums/session.enum';

// GH-58 — dựng query `scope` cho SSE summary stream (docs/battery-realtime-description.md §4/§6).
// Verified BE (BatteryRealtimeAuthorizationHelper): BatteryAsset.CustomerId == JWT AccountId
// → Customer truyền `customer:{accountId}` (BE check customerId == actorUserId).
// RBAC mobile: Customer chỉ `customer:{self}` / `assets:{pin sở hữu}`; Staff `assets:{bất kỳ}`.

// BE giới hạn list `assets:` tối đa 50 id (TelemetryScope.MaxIds). KHÔNG áp cho `customer:` (1 id).
export const FLEET_MAX_ASSET_IDS = 50;

export interface FleetScopeInput {
  accountId: string;
  assetIds?: string[];
}

/**
 * Customer → `customer:{accountId}` (mọi pin của mình, không giới hạn số pin).
 * Staff    → `assets:{id1,…}` (cap 50). Cần truyền assetIds.
 * Trả `null` nếu thiếu dữ liệu (Staff không có assetIds, hoặc role không hỗ trợ) → caller không mở stream.
 */
export function buildFleetScope(role: UserRole, input: FleetScopeInput): string | null {
  if (role === UserRole.CUSTOMER) {
    if (!input.accountId) return null;
    return `customer:${input.accountId}`;
  }

  if (role === UserRole.STAFF) {
    const ids = input.assetIds ?? [];
    if (ids.length === 0) return null;
    if (ids.length > FLEET_MAX_ASSET_IDS) {
      console.warn(
        `[buildFleetScope] ${ids.length} assetIds > ${FLEET_MAX_ASSET_IDS} (BE limit) — cắt còn ${FLEET_MAX_ASSET_IDS}.`,
      );
    }
    return `assets:${ids.slice(0, FLEET_MAX_ASSET_IDS).join(',')}`;
  }

  // Admin/Manager — scope rộng (customer/site/all…) ngoài phạm vi mobile.
  return null;
}
