## BÁO CÁO CODE REVIEW — feature/GH-10-customer-ticket-mgmt — 2026-06-05
### Scope: Mobile (React Native / Expo)
### Effort: Standard

---

### TÓM TẮT
Feature ticket management cho Customer được implement đúng cấu trúc (services → hooks → screens), auth được bảo vệ qua `(customer)/_layout.tsx`. Một Critical bug về `canReopen` logic đã được phát hiện và fix trong cùng review pass.

---

### PHÂN TÍCH

🔴 **Critical (FIXED):** `app/(customer)/tickets/[id].tsx:112`
- **Vấn đề:** `canReopen = (status === 'Resolved' || status === 'Closed') && reopenCount < 3`
- **Impact:** Nút "Mở lại" xuất hiện trên trạng thái sai; không xuất hiện khi `ClosedPendingRate` (đúng theo plan)
- **Fix:** `canReopen = ticket.status === 'ClosedPendingRate'` — 7-day limit do BE enforce (trả 403)

🟡 **Warning (FIXED):** `app/(customer)/tickets/[id].tsx:138` — `handleReopen` catch không phân biệt 403
- Plan chỉ định "FAIL (403 quá 7 ngày): toast.error('Đã quá 7 ngày...')"
- Fix: check `err instanceof HttpError && err.statusCode === 403` trước khi chọn message

🟡 **Warning (FIXED):** `app/(customer)/tickets/create.tsx` — thiếu back button
- User không có cách thoát khỏi màn hình create nếu không submit
- Fix: thêm `Pressable → router.back()` ở header

✅ **Pass: Architecture**
- Không có API call trong component — tất cả qua `ticketService` → TanStack Query hook
- Feature code nằm trong `src/features/tickets/` — không có cross-feature import
- Không tạo Axios instance mới — dùng `axiosInstance` từ `src/lib/axios.ts`
- Zustand không dùng cho server state (chỉ sessionStore cho auth)

✅ **Pass: Endpoints & Query Keys**
- Tất cả URLs qua `ENDPOINTS.TICKETS` — không hardcode string
- `useQuery` dùng `QUERY_KEY.tickets.list(params)` / `QUERY_KEY.tickets.detail(id)` ✅
- `invalidateQueries` dùng `KEY.tickets` (broad) và `QUERY_KEY.tickets.detail(id)` (narrow) ✅

✅ **Pass: Auth & Security**
- `(customer)/_layout.tsx` kiểm tra `!user || user.role !== 'CUSTOMER'` → redirect `/login` ✅
- Tất cả ticket screens nằm trong `(customer)/` group → được bảo vệ tự động
- Không có `AsyncStorage`, `localStorage`, không lưu token plain text ✅

✅ **Pass: Code Quality**
- Không có `console.log` còn sót
- Naming conventions: PascalCase components, `use{Name}` hooks, `{name}.service.ts`
- `tsc --noEmit` + `eslint --max-warnings=0` → PASS ✅
- Manual `safeParse()` đúng pattern (không dùng React Hook Form)

✅ **Pass: UX**
- Loading state: `ActivityIndicator` trên list, detail, và mutation buttons
- Error state: retry button trên detail screen; Alert.alert cho mutation errors
- Pull-to-refresh trên list; pagination với `onEndReached`
- Comment filter `isInternal=false` đúng spec

---

### RỦI RO & LƯU Ý
- `(customer)/_layout.tsx` chưa khai báo explicit `Stack.Screen name="tickets"` — screens dùng default options, hoạt động được nhưng không rõ ràng. Không critical vì screens có custom header.
- `useTickets` query không có `staleTime` override — dùng global default 2 phút. Có thể muốn shorter interval nếu ticket status thay đổi thường xuyên (discussion với team).
- `SlaCountdown` tính time remaining từ `new Date()` client-side — không real-time (chỉ update khi re-render). Acceptable cho scope capstone.

---

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**

1 Critical (canReopen logic) + 2 Warning (403 message, missing back button) đã được fix inline trong review pass này. Build và lint sạch.
