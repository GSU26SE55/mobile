# BÁO CÁO CODE REVIEW — feat/GH-10-customer-ticket-management — 2026-06-10

## TÓM TẮT

PR lớn (82 files, 8618 insertions) bao phủ toàn bộ luồng Customer Ticket Management + scaffold staff app + notifications feature. Kiến trúc và patterns đúng chuẩn Mobile rules. Có 1 lỗi critical về SLA labels sai so với domain definition và 2 warning về scope expansion + mock data trong production code.

---

## PHÂN TÍCH

### 🔴 Critical

**`src/features/tickets/components/CreateTicketStepper.tsx:97-102`** — SLA time labels sai so với domain rules

`getSuggestedPriority()` hiển thị thời gian SLA không đúng với quy định hệ thống:
- P1 Critical hiển thị `"< 2h"` → đúng phải là `"< 4h"` (P1=4h theo design.md)
- P2 High hiển thị `"< 8h"` → đúng phải là `"< 24h"` (P2=24h)
- P3 Normal hiển thị `"< 24h"` → đúng phải là `"< 72h"` (P3=72h)

Dù đây là UI hint cho customer khi chọn category, labels sai có thể gây hiểu nhầm và mâu thuẫn với SLA thực tế trên ticket detail. Fix:
```tsx
// P1Critical
time: '< 4h'
// P2High
time: '< 24h'
// P3Normal
time: '< 72h'
```

---

### 🟡 Warning

**`src/stores/alertsStore.ts:36,43,...`** — Hardcoded relative time strings không update

`alertsStore` chứa mock alerts với `time: "8 phút trước"`, `time: "21 phút trước"` — static strings sẽ không bao giờ thay đổi sau khi app mount. Khi integrate API, field này nên là ISO timestamp và tính toán relative time khi render (dùng `date-fns`). Acceptable trong phase mock nhưng cần chuyển sang real API trước Sprint kế.

**`app/(customer)/tickets/[id].tsx:31-200`** — `MOCK_TICKET_DETAILS` còn tồn tại trong production code

Có ~170 dòng mock data tĩnh. Code path chỉ fall vào mock khi ticket id bắt đầu bằng `"mock-"` — ok về logic, nhưng nên có `__DEV__` guard hoặc xóa trước khi integrate API thật để tránh confusion.

**`src/features/staff/` + `src/features/notifications/` + `app/(staff)/`** — Scope expansion ngoài GH-10

Plan.md của GH-10 scope là "Customer Ticket Management" và explicitly loại Staff/Manager actions ra ngoài scope. PR này đã thêm toàn bộ staff feature và notifications feature. Code chạy đúng nhưng nên được tracked trong issue riêng để sprint board phản ánh đúng tiến độ thực tế.

---

### ✅ Pass

- **No AsyncStorage for tokens** — không có `AsyncStorage` import trong codebase mới; tokens đi qua `expo-secure-store` via `src/lib/secureStore.ts`
- **API calls qua services → hooks** — `staffService`, `notificationService`, `ticketService` đúng pattern; không có axios call trực tiếp trong component
- **Axios config nhất quán** — `axiosInstance` từ `src/lib/axios.ts` dùng nhất quán, không có instance mới
- **Zustand store structure nhất quán** — `alertsStore`, `sessionStore` đều dùng `create<State>((set, get) => (...))` đúng pattern
- **KeyboardAvoidingView** — `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` đúng cho cả 2 platform
- **`profile.skills` null-safety** — `Array.isArray()` guard trong `useStaffProfile.ts` + `(profile.skills ?? []).map(...)` trong JSX
- **`expo-secure-store` đúng cách** — logout gọi `clearTokens()` từ secureStore, không dùng AsyncStorage
- **Zod validation** — `commentSchema.safeParse()` manual (không dùng React Hook Form) đúng Mobile rules
- **ENDPOINTS single source of truth** — tất cả endpoints mới (`STAFF`, `STAFF_TICKETS`, `NOTIFICATIONS`) đều khai báo trong `src/lib/endpoints.ts`; không có hardcoded URL trong services
- **Error fallback graceful** — staff profile hiển thị mock data + warning banner khi API lỗi, không crash
- **Staff profile crash fix** — `Array.isArray()` guard ngăn "Cannot read property 'length' of undefined"
- **Chat UI keyboard fix** — `KeyboardAvoidingView` behavior đúng, input không bị khuất bàn phím
- **CreateTicketStepper footer layout** — `flexDirection: 'row'` cố định trong `styles.footer`, không còn lỗi button nhỏ/không text

---

## RỦI RO & LƯU Ý

- SLA labels sai (Critical) hiển thị cho customer khi tạo ticket — P1 hiện "2h" thay vì "4h" có thể tạo kỳ vọng sai
- `useStaffProfile` hardcode `skillTier: 'Tier1'` — backend `/api/auth/me` không trả tier; cần update khi BE thêm field
- Staff feature được implement nhưng chưa có issue riêng trên GitHub — leader cần tạo issue tương ứng để track đúng sprint board

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Critical issue đã được fix trong cùng session: SLA labels trong `CreateTicketStepper.tsx` đã sửa thành `< 4h`, `< 24h`, `< 72h` đúng domain rules.

Warnings (không blocking):
- `alertsStore.ts` hardcoded relative time strings — cần fix khi integrate API thật
- `MOCK_TICKET_DETAILS` trong `[id].tsx` — cần xóa trước khi integrate API thật
- Staff + notifications features cần issue riêng trên GitHub

Bước tiếp theo: `/kltn-test GH-10`
