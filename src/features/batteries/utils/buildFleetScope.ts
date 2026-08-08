import { UserRole } from '@/src/shared/enums/session.enum';

// GH-58 — builds the `scope` query for the SSE summary stream (docs/battery-realtime-description.md §4/§6).
// Verified BE (BatteryRealtimeAuthorizationHelper): BatteryAsset.CustomerId == JWT AccountId
// → Customer passes `customer:{accountId}` (BE checks customerId == actorUserId).
// Mobile RBAC: Customer only gets `customer:{self}` / `assets:{owned batteries}`; Staff gets `assets:{any}`.

// BE caps the `assets:` list at 50 ids (TelemetryScope.MaxIds). Does NOT apply to `customer:` (1 id).
export const FLEET_MAX_ASSET_IDS = 50;

export interface FleetScopeInput {
  accountId: string;
  assetIds?: string[];
}

/**
 * Customer → `customer:{accountId}` (all of their own batteries, no count limit).
 * Staff    → `assets:{id1,…}` (capped at 50). Requires assetIds.
 * Returns `null` if data is missing (Staff has no assetIds, or the role isn't supported) → caller does not open the stream.
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
        `[buildFleetScope] ${ids.length} assetIds > ${FLEET_MAX_ASSET_IDS} (BE limit) — truncating to ${FLEET_MAX_ASSET_IDS}.`,
      );
    }
    return `assets:${ids.slice(0, FLEET_MAX_ASSET_IDS).join(',')}`;
  }

  // Admin/Manager — broad scopes (customer/site/all…) are outside mobile's scope.
  return null;
}
