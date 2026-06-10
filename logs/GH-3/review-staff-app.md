## BÁO CÁO CODE REVIEW — feature/GH-3-auth-flow (Staff App) — 2026-06-09
### Scope: Mobile (React Native / Expo)
### Effort: Deep (multi-screen, cross-feature, full Staff App)

### TÓM TẮT
Staff Mobile App implementation gồm 31 files mới/sửa (types, services, hooks, components, screens, navigation). Code tuân thủ Mobile rules, feature isolation, và security requirements. TypeScript biên dịch 0 lỗi. Không có Critical issues.

### PHÂN TÍCH

#### Architecture
- ✅ Không có API call trực tiếp trong component — tất cả qua `services/` -> TanStack Query hooks
- ✅ Files đặt đúng `src/features/staff/` và `src/features/notifications/`
- ✅ `features/staff` không import từ `features/notifications` (và ngược lại) — feature isolation đạt
- ✅ Zustand chỉ dùng cho auth session (`sessionStore`) — server state qua TanStack Query
- ✅ Không tạo Axios instance mới — dùng `src/lib/axios.ts`
- ✅ QueryKey dùng factory pattern (`QUERY_KEY.staffTickets.list()`) — không inline string

#### Mobile-Specific
- ✅ Token dùng `expo-secure-store` (qua `clearTokens()` trong profile logout) — KHÔNG dùng AsyncStorage
- ✅ Navigation dùng Expo Router (`router.push()`, `router.back()`, `<Redirect>`)
- ✅ Không eject khỏi Expo managed workflow
- ✅ Không thêm package mới — dùng stack hiện có (TanStack Query, Zustand, Axios, Expo Router)
- ✅ `app/(staff)/_layout.tsx` có role check + isHydrating guard

#### Code Quality
- ✅ Components PascalCase (StaffTicketCard, TicketActionBar, HoldModal...)
- ✅ Không hardcode URL/token/config — endpoints qua `ENDPOINTS` constant
- ✅ Loading states xử lý (ActivityIndicator, skeleton patterns)
- ✅ Không có `console.log` sót lại
- ✅ Không có `as any` cast ngoài TabBar props (nhất quán với customer app pattern)
- ✅ `npx tsc --noEmit` — 0 errors

#### Error Handling
- 🟡 Warning: Mutation hooks không có `onError` handler trong hook definition
  - **Ghi chú:** Nhất quán với customer hooks pattern (cũng không có `onError`). Error handling ở component level. Chấp nhận được cho MVP — cân nhắc thêm toast error handling khi BE endpoints live.

#### Auth & Security
- ✅ Staff screens có role check (`user.role !== 'STAFF'` → redirect to login)
- ✅ Token không bị expose ra log hay UI
- ✅ `secureStore.ts` wrapper được dùng (không gọi `expo-secure-store` trực tiếp)

#### Business Logic
- ✅ Hold reasons đúng 3 options theo BR-04: WAITING_CUSTOMER, WAITING_PARTS, WAITING_ONSITE_SCHEDULE
- ✅ Ticket action bar logic đúng state machine: Assigned→Start, InProgress→Hold/Resolve/Escalate, Waiting*→Resume
- ✅ Escalation reasons: SkillGap, PartsRequired, SafetyConcern, CustomerComplaint (đúng enum)
- ✅ Priority hiển thị đúng P1/P2/P3 với color coding
- ✅ SLA countdown tích hợp đúng component

#### Files Created (27 new + 4 modified)
| Category | Count | Files |
|----------|-------|-------|
| Types | 2 | staff.types.ts, notification.types.ts |
| Services | 3 | staff.service.ts, staffTicket.service.ts, notification.service.ts |
| Hooks | 12 | 3 query + 9 mutation hooks |
| Components | 7 | StaffTicketCard, TicketActionBar, HoldModal, ResolveModal, EscalateModal, MaintenanceLogForm, NotificationCard |
| Screens | 5 | Tab layout, Dashboard, Ticket detail, Notifications, Profile |
| Modified | 4 | endpoints.ts, queryKeys.ts, session.types.ts, (staff)/_layout.tsx + index.tsx |

### RỦI RO & LƯU Ý
- Mock data hardcoded trong screens (dashboard, notifications, ticket detail, profile) — cần remove khi BE endpoints sẵn sàng
- Mutation hooks chưa có global error toast — nên thêm khi tích hợp BE thật
- Knowledge Base feature (§8 Wiki flow) chưa implement — deferred to separate issue per plan
- Push notification registration chưa implement — separate issue

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**

Code clean, type-safe, tuân thủ Mobile rules, feature isolation đạt, security requirements đáp ứng. Sẵn sàng cho `/kltn-test` và `/kltn-ship`.
