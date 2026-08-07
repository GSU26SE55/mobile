import { getToken, setToken, clearToken } from '../../../lib/secureStore';

/**
 * Mốc "đã báo tới đâu" — dùng chung giữa 2 đường bắn banner:
 *  - SignalR (app đang chạy)      → advanceLastSeen sau mỗi event
 *  - background sync / catch-up   → chỉ bắn banner cho cái mới hơn mốc
 *
 * Không có mốc chung thì notification đã hiện live sẽ bị catch-up bắn lại lần nữa khi user
 * quay về foreground — user thấy đúng một cảnh báo hai lần.
 *
 * BE fan-out 1 sự kiện thành nhiều row; `NotificationWriter` ghi InApp TRƯỚC Push nên
 * `Push.createdAt` lớn hơn `InApp.createdAt` vài micro-giây. Vì vậy advance theo createdAt
 * của row Push (cái SignalR gửi) sẽ tự loại luôn row InApp anh em khỏi catch-up.
 */

const LAST_SEEN_KEY = 'notif_last_seen_at';

// Cache in-memory: SignalR gọi advance mỗi event, không nên chạm SecureStore liên tục.
// Background task chạy trong JS context mới nên cache rỗng — đọc lại từ store, vẫn đúng.
let cached: number | null = null;

/** `null` = chưa từng khởi tạo (lần đăng nhập đầu trên máy này). */
export async function readLastSeen(): Promise<number | null> {
  if (cached !== null) return cached;

  const raw = await getToken(LAST_SEEN_KEY);
  if (!raw) return null;

  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;

  cached = parsed;
  return parsed;
}

/** Chỉ tiến, không lùi — event tới không đúng thứ tự cũng không làm hở mốc. */
export async function advanceLastSeen(isoTimestamp: string): Promise<void> {
  const next = Date.parse(isoTimestamp);
  if (Number.isNaN(next)) return;

  const current = await readLastSeen();
  if (current !== null && next <= current) return;

  cached = next;
  await setToken(LAST_SEEN_KEY, new Date(next).toISOString()).catch(() => {});
}

/**
 * Đặt mốc = bây giờ mà KHÔNG bắn banner nào.
 * Dùng cho lần đăng nhập đầu: user có sẵn hàng trăm notification chưa đọc, dội hết lên
 * ngay lúc vừa login là cách nhanh nhất để họ tắt notification của app.
 */
export async function initLastSeenToNow(): Promise<void> {
  const now = Date.now();
  cached = now;
  await setToken(LAST_SEEN_KEY, new Date(now).toISOString()).catch(() => {});
}

/** Logout: xoá mốc để tài khoản đăng nhập sau không kế thừa mốc của tài khoản trước. */
export async function clearLastSeen(): Promise<void> {
  cached = null;
  await clearToken(LAST_SEEN_KEY).catch(() => {});
}
