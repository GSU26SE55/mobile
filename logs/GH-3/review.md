# BÁO CÁO CODE REVIEW — feature/GH-3-auth-flow — 2026-05-29

## TÓM TẮT
Auth flow hoàn chỉnh cho Customer và Staff, đúng kiến trúc Mobile rules. Phát hiện và fix 1 critical (expo-secure-store version mismatch) và 2 warning nhỏ trong session review.

---

## PHÂN TÍCH

### Critical (đã fix)

🔴 **`package.json` — `expo-secure-store@56.0.4` không tương thích Expo SDK 54**
- `npm install expo-secure-store` cài bản latest (v56) thay vì version tương thích SDK 54 (v14.x)
- Hậu quả: native module `ExpoSecureStore` không tồn tại trong SDK 54 build → crash khi gọi SecureStore API
- **Fix:** downgrade xuống `expo-secure-store@14.2.4` (SDK 54 compatible) ✅

---

### Warning

🟡 **`src/lib/axios.ts:37` — Timeout trong `tryRefresh` có thể gây race condition**
- Sau 10s, `setTimeout` callback reset `isRefreshing = false` và flush queue.
- Nếu slow server vẫn đang xử lý refresh request, caller mới sẽ khởi tạo refresh thứ hai (vì `isRefreshing = false`).
- Không gây crash nhưng có thể gây duplicate `/refresh-token` call trong điều kiện mạng yếu.
- **Gợi ý:** Acceptable trong scope capstone. Fix clean hơn là dùng `AbortController` để cancel request khi timeout.

🟡 **`app/(tabs)/` — Dead code boilerplate còn tồn tại**
- 3 file Expo template cũ (`_layout.tsx`, `index.tsx`, `explore.tsx`) không còn được dùng sau khi rewrite `app/_layout.tsx`.
- Không có route nào trong Stack trỏ tới `(tabs)` nên không ảnh hưởng runtime.
- **Gợi ý:** Xóa `app/(tabs)/` và `app/modal.tsx` để giữ repo sạch. Tuy nhiên nằm ngoài scope GH-3 — có thể làm thêm hoặc để ticket riêng.

---

### ✅ Pass

| Tiêu chí | Kết quả |
|----------|---------|
| `tsc --noEmit` 0 errors | ✅ |
| `eslint --max-warnings=0` 0 warnings | ✅ |
| Token storage: `expo-secure-store` (không AsyncStorage) | ✅ |
| 3-case hydration (access ok / no refresh / refresh) | ✅ |
| Auth guard: `useSegments + useRouter` đúng Expo Router pattern | ✅ |
| Admin/Manager block: async IIFE `clearTokens()` + Alert | ✅ |
| Double-refresh guard: `isRefreshing` flag + `pendingQueue` | ✅ |
| Refresh timeout 10s | ✅ |
| JWT decode claims đúng BE contract (AccountId, FullName PascalCase; role lowercase; perm[]) | ✅ |
| Form validation native (không dùng Zod) | ✅ |
| OTP resend cooldown 60s | ✅ |
| Forgot password 3-step + `expiresInSeconds` countdown | ✅ |
| Staff: Login + Forgot Password (không có Register) | ✅ |
| Service layer: API calls qua `services/` → hook (không gọi trực tiếp trong component) | ✅ |
| Logout best-effort (clear local state dù server call fail) | ✅ |
| `redirectByRole` trả `null` cho Admin/Manager (không để vào app) | ✅ |

---

## RỦI RO & LƯU Ý

- **`EXPO_PUBLIC_API_URL` phải set** trong `.env` trước khi test: `EXPO_PUBLIC_API_URL=http://<server>:5000`. Nếu thiếu, fallback về `localhost:5000` (không reach được từ thiết bị thật — chỉ Simulator).
- **`app/(tabs)/`** vẫn còn — nếu ai navigate nhầm sẽ render boilerplate cũ. Cần xóa sau GH-3.
- **expo-secure-store native APIs** cần chạy trên device/simulator — không test được bằng Jest thuần mà không mock.

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Critical đã được fix (package version). Warnings không ảnh hưởng đến correctness trong điều kiện bình thường. Code đúng kiến trúc, type-safe, lint-clean.
