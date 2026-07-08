## BÁO CÁO CODE REVIEW — feat/GH-55-alerts-incidents-flow — 2026-06-28
### Scope: FE (Mobile)
### Effort: Deep (nhiều file, cross-role customer + staff)

### TÓM TẮT
Implement đầy đủ M-2: feature `incidents` (enum/types/service/schema/5 hook/3 component), màn Customer (segment + detail read-only), màn Staff (list segment + detail có action + Resolve alert + entry tab Thông báo). `tsc --noEmit` PASS (No errors), `eslint --max-warnings=0` sạch. Không phát hiện lỗi Critical.

### PHÂN TÍCH

✅ **Architecture**
- Không có business logic / API call trực tiếp trong component — tất cả qua `services/` → hook TanStack Query (`useIncidents`, `useMyIncidents`, `useIncident`, `useAcknowledgeIncident`, `useResolveIncident`, `useAlerts`, `useResolveAlert`).
- File đặt đúng chỗ: feature mới `src/features/incidents/`; enum cross-role ở `src/shared/enums/incident.enum.ts`; hook all-alert & resolve-alert ở `src/features/batteries/` (cùng nơi alerts hiện có).
- Không tạo Axios instance mới — dùng `lib/axios.ts`. Không Zustand cho server state.

✅ **Error Handling**
- `queryKey` dùng `QUERY_KEY.incidents.{list,detail}` factory — không inline array (`useIncidents.ts:11`, `useIncident.ts:8`, `useMyIncidents.ts:25`).
- `invalidateQueries` dùng `KEY.incidents` / `KEY.alerts` root — không hardcode string (`useAcknowledgeIncident.ts:11`, `useResolveIncident.ts:13`, `useResolveAlert.ts:12`).
- Action mutation gọi qua `mutateAsync` trong `try/catch` + `handleErrorApi({ error })` tại screen (`(staff)/incidents/[id].tsx:75,93`, `(staff)/alerts/[id].tsx` handleResolve) — đồng bộ pattern `useAcknowledgeAlert` hiện có.
- Resolve note validate client `resolveIncidentSchema.safeParse` trước khi gọi API (`(staff)/incidents/[id].tsx:84-91`) — chặn <5/>2000 ký tự, không gọi API thừa.

✅ **Contract đúng doc (đã đối chiếu lại)**
- Method: alert resolve = `PATCH` (`alert.service.ts:resolve`), incident acknowledge/resolve = `POST` (`incident.service.ts`). Không lỗi 405.
- Status badge RIÊNG cho incident (`IncidentStatusBadge.tsx`) — `Resolved=3` không nhầm `AlertStatus.Resolved=4`.
- Customer scope theo `siteId` non-null + distinct, build `siteNameMap` từ battery assets (`useMyIncidents.ts:20-31`) — chống rò rỉ + hiển thị tên site (DTO không có siteName).

✅ **Auth / Navigation**
- Customer incident detail READ-ONLY (không render action) — `(customer)/incidents/[id].tsx`. Staff action acknowledge/resolve chỉ trong group `(staff)` (BE cũng chặn 403).
- Group `(customer)`/`(staff)` đã gate role ở `_layout.tsx` (Redirect nếu sai role) → screen mới kế thừa bảo vệ.
- Route mới đăng ký trong layout: `(customer)/_layout.tsx` (+incidents/[id]), `(staff)/_layout.tsx` (+alerts/index, +incidents/[id]). `.expo/types` đã regenerate → typed routes hợp lệ.
- Loading/error state xử lý đủ (detail screens isLoading/isError; `IncidentList` loading/empty).
- Không còn `console.log`.

🟡 **Warning**
- `src/features/incidents/hooks/useMyIncidents.ts:4` import `useMyBatteryAssets` từ `features/batteries` — cross-feature import. Hợp lý về domain (incident cần siteId từ pin của Customer) và eslint không chặn (mobile chưa bật `no-restricted-imports` strict như Web). Chấp nhận; nếu sau này siết isolation thì lift battery assets lên `shared/`.
- `useMyIncidents` tính `siteIds`/`siteNameMap` mỗi render (không memo) — giống `useMyAlerts` hiện có, chi phí nhỏ, không blocking.
- `(staff)/alerts/index.tsx` dùng `useAlerts()` list toàn bộ alert (pageSize=100, không infinite scroll) — đủ cho scope capstone; lượng lớn alert có thể cần phân trang sau.
- Màu severity hardcode trong `IncidentCard.tsx`/detail — đồng bộ style alerts hiện có; minor.

### RỦI RO & LƯU Ý
- Lộ-dữ-liệu CỐ Ý (đã ghi plan): Customer thấy incident cấp-site của site có ≥1 pin mình — đúng nghiệp vụ (sự cố toàn site).
- `useAlerts()` của Staff không filter theo site/role → hiển thị mọi alert toàn hệ thống; đúng kỳ vọng internal staff nhưng cần xác nhận BE không yêu cầu scope.
- Thay đổi nhỏ vs plan: thêm hook `useAlerts.ts` (đã ghi plan.md).
- `git status` còn file ngoài GH-55 (docs/*.md, logs/GH-56, GH-57) — KHÔNG đụng; `/kltn-ship` chỉ stage file ticket.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
(tsc PASS, eslint sạch, contract khớp doc, không Critical. Warning đều là minor/đã có tiền lệ trong codebase.)
