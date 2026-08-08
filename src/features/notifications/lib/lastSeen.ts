import { getToken, setToken, clearToken } from '../../../lib/secureStore';

/**
 * "How far we've notified up to" marker — shared between the 2 banner-firing paths:
 *  - SignalR (app running)         → advanceLastSeen after each event
 *  - background sync / catch-up    → only fires a banner for something newer than the marker
 *
 * Without a shared marker, a notification already shown live would get fired again by catch-up when the
 * user returns to foreground — the user would see the exact same alert twice.
 *
 * BE fans out 1 event into multiple rows; `NotificationWriter` writes InApp BEFORE Push, so
 * `Push.createdAt` is a few microseconds later than `InApp.createdAt`. So advancing by the createdAt
 * of the Push row (the one SignalR sends) automatically excludes its sibling InApp row from catch-up.
 */

const LAST_SEEN_KEY = 'notif_last_seen_at';

// In-memory cache: SignalR calls advance on every event, shouldn't hit SecureStore constantly.
// A background task runs in a fresh JS context so the cache starts empty — reads back from the store, still correct.
let cached: number | null = null;

/** `null` = never initialized (first login on this device). */
export async function readLastSeen(): Promise<number | null> {
  if (cached !== null) return cached;

  const raw = await getToken(LAST_SEEN_KEY);
  if (!raw) return null;

  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;

  cached = parsed;
  return parsed;
}

/** Only moves forward, never backward — an out-of-order event can't rewind the marker. */
export async function advanceLastSeen(isoTimestamp: string): Promise<void> {
  const next = Date.parse(isoTimestamp);
  if (Number.isNaN(next)) return;

  const current = await readLastSeen();
  if (current !== null && next <= current) return;

  cached = next;
  await setToken(LAST_SEEN_KEY, new Date(next).toISOString()).catch(() => {});
}

/**
 * Sets the marker = now with NO banner fired.
 * Used for the first login: the user may already have hundreds of unread notifications, and dumping
 * them all right after login is the fastest way to make them turn off the app's notifications.
 */
export async function initLastSeenToNow(): Promise<void> {
  const now = Date.now();
  cached = now;
  await setToken(LAST_SEEN_KEY, new Date(now).toISOString()).catch(() => {});
}

/** Logout: clears the marker so the next account to log in doesn't inherit the previous account's marker. */
export async function clearLastSeen(): Promise<void> {
  cached = null;
  await clearToken(LAST_SEEN_KEY).catch(() => {});
}
