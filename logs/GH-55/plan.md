# Plan — GH-55: [Mobile] Alerts & Incidents — Notification flow (M-2)

## Metadata
- **Status:** REVIEWING | **Role:** FE (Mobile) | **Ngày:** 2026-06-28
- **Dev:** Trần Minh Trí (SE183109)
- **Issue:** #55 — https://github.com/GSU26SE55/mobile/issues/55
- **Sprint:** Sprint 4 (due 2026-07-11)

## Mục tiêu
Gộp M3 + M4: bổ sung màn **Sự cố môi trường (Environmental Incidents)** — list / detail / action — và gắn cùng màn **Cảnh báo (Alerts)** hiện có dưới dạng segment "Cảnh báo | Sự cố". Đồng thời thêm action **Resolve** cho Alert + **Acknowledge/Resolve** cho Incident phía Staff. Áp dụng cho cả Customer (read-only incidents) và Staff (có action).

## Scope
**Trong scope:**
- Feature mới `src/features/incidents/` (enum, types, service, hooks, components, schema).
- Customer: segment "Sự cố" trong màn alerts hiện có + màn chi tiết incident (read-only).
- Staff: màn list alerts+incidents (segment) + chi tiết incident có action + nút Resolve trên chi tiết alert.
- Alert `resolve` endpoint + service + hook (Staff-only) — phần còn thiếu của alerts.
- Incident scoping cho Customer theo `siteId` của pin Customer sở hữu (chống rò rỉ dữ liệu, mirror `useMyAlerts`).

**Ngoài scope:**
- **KHÔNG** đụng vào alert list/detail/acknowledge hiện có (đã hoàn thành ở ticket trước) — chỉ thêm phần thiếu.
- `POST /environmental-incidents/{id}/false-alarm` — chỉ Admin/Manager, không có trên mobile.
- Tạo incident (`POST /environmental-incidents`) — do device/gateway tạo, không phải mobile.
- Push notification receive pipeline (banner/tap/badge) — scope riêng.
- Redesign bottom-tab bar.
- `GET /environmental-incidents/by-site/{siteId}/active` — không màn nào trong M-2 dùng → để dành dashboard site sau (Simplicity First).

## Endpoints
> ⚠️ Method là cột bắt buộc đúng — sai sẽ tạo nhầm `axios.get` → 405 lúc runtime.

| Method | Path | Mục đích / Quyền |
|--------|------|------------------|
| **PATCH** | `/api/alerts/{id}/resolve` | Resolve alert — **Staff-only**. 409 nếu Merged. (phần thiếu) |
| GET | `/api/environmental-incidents` | List incident (filter: siteId, status, incidentType, from, to). Mọi role. Default `pageSize=50`. |
| GET | `/api/environmental-incidents/{id}` | Chi tiết incident (đủ lifecycle). Mọi role. |
| **POST** | `/api/environmental-incidents/{id}/acknowledge` | Open → Acknowledged. **Staff-only**. Trả DTO. 409 nếu state ≠ Open. |
| **POST** | `/api/environmental-incidents/{id}/resolve` | → Resolved, body `{ resolutionNote }` (5–2000 ký tự). **Staff-only**. Trả DTO. |

## Enums & Label maps
> Copy **chính xác** giá trị từ `docs/api-battery.md:123-141`. ⚠️ **Cảnh báo trùng tên dễ nhầm:** `EnvironmentalIncidentStatusEnum.Resolved = 3` (KHÁC `AlertStatusEnum.Resolved = 4`). **KHÔNG** tái dùng badge/label của alert cho incident — phải có map riêng.

| Enum | File nguồn | Giá trị |
|------|-----------|---------|
| `EnvironmentalIncidentTypeEnum` | `shared/enums/incident.enum.ts` (create) | `Smoke=1, FireDetected=2, GasLeak=3, Flood=4, OverheatHazard=5, Other=99` |
| `EnvironmentalIncidentStatusEnum` | `shared/enums/incident.enum.ts` (create) | `Open=1, Acknowledged=2, Resolved=3, FalseAlarm=4` |
| `AlertSeverityEnum` (severity của incident) | `shared/enums/alert.enum.ts` (re-use) | `Info=1, Warning=2, Critical=3` |

**Label maps tiếng Việt** (đặt trong `incident.types.ts`):
- `INCIDENT_TYPE_LABEL`: Smoke→"Khói", FireDetected→"Cháy", GasLeak→"Rò rỉ khí", Flood→"Ngập nước", OverheatHazard→"Nguy cơ quá nhiệt", Other→"Khác".
- `INCIDENT_STATUS_LABEL`: Open→"Mở", Acknowledged→"Đã xác nhận", Resolved→"Đã xử lý", FalseAlarm→"Báo nhầm".
- Severity dùng lại label/màu của alert (`SEVERITY_COLORS` đã có trong alerts screen).

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/enums/incident.enum.ts` | create | `EnvironmentalIncidentTypeEnum`, `EnvironmentalIncidentStatusEnum` (`as const`) — xem giá trị chính xác ở §Enums & Label maps. Severity tái dùng `AlertSeverityEnum`. |
| `src/lib/endpoints.ts` | modify | Thêm block `ENVIRONMENTAL_INCIDENTS` + `ALERTS.RESOLVE`. |
| `src/lib/queryKeys.ts` | modify | Thêm `KEY.incidents` + `QUERY_KEY.incidents.{list,detail}`. |
| `src/features/incidents/types/incident.types.ts` | create | `EnvironmentalIncidentDto` (KHÔNG có `siteName` — chỉ `siteId`), `IncidentListParams` (gồm `pageSize`), `ResolveIncidentPayload`, label maps (§Enums & Label maps). |
| `src/features/incidents/services/incident.service.ts` | create | getList, getById, acknowledge, resolve. (KHÔNG thêm `getActiveBySite` — không màn nào dùng, Simplicity First.) |
| `src/features/incidents/schemas/resolveIncident.schema.ts` | create | Zod: `resolutionNote` 5–2000 ký tự, trim non-empty. |
| `src/features/incidents/hooks/useIncidents.ts` | create | List chung (Staff — toàn bộ site). Truyền `pageSize: 100` rõ ràng (BE default chỉ 50). |
| `src/features/incidents/hooks/useMyIncidents.ts` | create | Customer — gom `siteId` **non-null & distinct** từ pin mình → list `?siteId=&pageSize=100` per-site (`Promise.all`) → merge + sort `detectedAt` DESC. Scope theo **siteId** (khác useMyAlerts theo batteryAssetId). Trả kèm `siteNameMap` (siteId→siteName build từ `useMyBatteryAssets`) để card hiển thị tên site (DTO incident không có `siteName`). |
| `src/features/incidents/hooks/useIncident.ts` | create | Detail. |
| `src/features/incidents/hooks/useAcknowledgeIncident.ts` | create | Staff — invalidate `KEY.incidents`. |
| `src/features/incidents/hooks/useResolveIncident.ts` | create | Staff — payload note, invalidate `KEY.incidents`. |
| `src/features/incidents/components/IncidentStatusBadge.tsx` | create | Badge theo status. |
| `src/features/incidents/components/IncidentCard.tsx` | create | Card item (type, severity, status, detectedAt). Tên site nhận qua prop `siteName?` (từ `siteNameMap`); nếu null → ẩn dòng site (không render UUID thô). |
| `src/features/incidents/components/IncidentList.tsx` | create | FlatList + loading/empty state (nhận data + onPressItem từ ngoài). |
| `src/features/batteries/services/alert.service.ts` | modify | Thêm `resolve(id)`. |
| `src/features/batteries/hooks/useResolveAlert.ts` | create | Staff — invalidate `KEY.alerts`. |
| `app/(customer)/(tabs)/alerts.tsx` | modify | Thêm segment "Cảnh báo \| Sự cố"; tab Sự cố render `IncidentList` (dùng `useMyIncidents`), điều hướng `(customer)/incidents/[id]`. |
| `app/(customer)/incidents/[id].tsx` | create | Chi tiết incident **read-only** (không có action). |
| `app/(customer)/_layout.tsx` | modify | Đăng ký `Stack.Screen name="incidents/[id]"`. |
| `app/(staff)/alerts/index.tsx` | create | Màn list Staff segment "Cảnh báo \| Sự cố": segment **alert** dùng hook alert hiện có (list theo asset/all); segment **incident** dùng `useIncidents`. |
| `app/(staff)/incidents/[id].tsx` | create | Chi tiết incident + action Acknowledge/Resolve (Resolve mở modal nhập note). |
| `app/(staff)/alerts/[id].tsx` | modify | Thêm nút **Resolve** (hiện khi status ∈ {Open, Acknowledged}). |
| `app/(staff)/_layout.tsx` | modify | Đăng ký `alerts/index` + `incidents/[id]`. |
| `app/(staff)/(tabs)/notifications.tsx` | modify | Thêm entry "Cảnh báo & Sự cố" → `(staff)/alerts/index`. |

## Approach
- **Incident severity** dùng lại `AlertSeverityEnum` (BE trả cùng enum) — không định nghĩa lại. Status/Type thì PHẢI dùng enum riêng (xem §Enums — `Resolved=3` khác alert).
- **Customer scoping (chống rò rỉ):** `GET /api/environmental-incidents` KHÔNG scope theo user → `useMyIncidents` lấy `siteId` **non-null + distinct** từ `useMyBatteryAssets`, gọi list `?siteId=&pageSize=100` cho từng site (`Promise.all`), merge + sort `detectedAt` DESC. **Cùng triết lý chống-leak như `useMyAlerts`, NHƯNG scope theo `siteId` (KHÔNG phải `batteryAssetId` như useMyAlerts) — vì incident là cấp site, `GET /environmental-incidents` chỉ filter bằng `siteId`.** `pageSize=100` để nhất quán cảm-giác-tải với useMyAlerts (BE default chỉ 50).
- **Quyết định lộ-dữ-liệu CỐ Ý (ghi rõ, không phải vô tình):** map pin→site nghĩa là Customer thấy **mọi incident cấp-site của bất kỳ site nào có ≥1 pin của mình**. Nếu 1 site có pin của nhiều Customer → Customer A thấy incident site đó. Về nghiệp vụ chấp nhận được (cháy/ngập là sự cố toàn site, không gắn 1 pin cụ thể).
- **siteName cho UI:** DTO incident không có `siteName` → build `Map<siteId, siteName>` client-side từ `useMyBatteryAssets` (BatteryAssetDto có `siteName`), truyền xuống card. Pin có `siteId=null` → bỏ qua khi gom siteIds.
- **Staff** xem toàn bộ (internal) → `useIncidents({ pageSize: 100 })` không filter site (staff list không có `siteName` map → hiển thị theo type + detectedAt, ẩn site). *(Dài hạn nên đề xuất BE thêm `siteName` vào DTO — ngoài scope M-2.)*
- **Action mutation:** check `res.data.isSuccess` (convention `CommonResponse`), KHÔNG check HTTP 200 cứng. acknowledge/resolve trả `EnvironmentalIncidentDto` mới; `onSuccess` invalidate `KEY.incidents` (list + detail + by-site tự refresh). Alert resolve invalidate `KEY.alerts`.
- **Segment UI:** state `useState<'alerts'|'incidents'>` trong màn; tái dùng style segment hiện có của alerts screen, không thêm lib.

## Edge Cases
- Customer không có pin → không có `siteId` → `useMyIncidents` trả rỗng → empty state "Chưa có sự cố".
- **Pin có nhưng `siteId = null`** (chưa gán site) → pin đó không sinh siteId → bỏ qua khi gom; nếu tất cả pin đều null site → list rỗng (empty state, không crash).
- DTO incident không có `siteName` → nếu `siteNameMap` miss (site lạ) → ẩn dòng site, không render UUID.
- Incident ở terminal state (`Resolved`/`FalseAlarm`) → ẩn nút action; nếu BE trả 409 → toast `handleErrorApi`.
- Alert `Resolved`/`Merged` → ẩn/disable nút Resolve; 409 Merged → toast.
- Resolve note rỗng / <5 / >2000 ký tự → chặn bằng `schema.safeParse`, hiện lỗi dưới input modal (không gọi API).
- Customer tuyệt đối không render action acknowledge/resolve trên incident (read-only, BE 403).
- `by-site/active` trả wrapper `PaginationResponse` nhưng không phân trang thật → chỉ đọc `items`.

## Acceptance Criteria
- [ ] Customer: màn Cảnh báo có 2 segment "Cảnh báo | Sự cố"; segment Sự cố hiển thị incident của site thuộc pin mình, bấm vào mở chi tiết read-only.
- [ ] Staff: vào được màn list "Cảnh báo | Sự cố" từ tab Thông báo; mở chi tiết incident thực hiện được Acknowledge và Resolve (có nhập note hợp lệ).
- [ ] Staff: chi tiết alert có nút Resolve hoạt động (Open/Acknowledged → Resolved), ẩn khi đã Resolved/Merged.
- [ ] Action sau khi thành công tự refresh list + detail (invalidate query đúng).
- [ ] Resolve note <5 hoặc >2000 ký tự bị chặn ở client, không gọi API.
- [ ] Customer không thấy bất kỳ nút action nào trên incident.
- [ ] HTTP method đúng doc: alert resolve = `PATCH`, incident acknowledge/resolve = `POST` (không 405 lúc runtime).
- [ ] Incident status hiển thị đúng nhãn riêng (`Resolved=3`), không nhầm với alert (`Resolved=4`).
- [ ] Pin có `siteId=null` không làm crash màn Sự cố của Customer.
- [ ] `npx tsc --noEmit` PASS (sau khi regenerate `.expo/types` cho route mới).

## Steps
- [x] Bước 1 — Enums + endpoints + queryKeys: `incident.enum.ts`, `ENVIRONMENTAL_INCIDENTS` + `ALERTS.RESOLVE`, `KEY/QUERY_KEY.incidents`. — 2026-06-28
- [x] Bước 2 — Types + service + schema: `incident.types.ts`, `incident.service.ts`, `resolveIncident.schema.ts`; thêm `alert.service.resolve`. — 2026-06-28
- [x] Bước 3 — Hooks: `useIncidents`, `useMyIncidents`, `useIncident`, `useAcknowledgeIncident`, `useResolveIncident`, `useResolveAlert`. — 2026-06-28
- [x] Bước 4 — Components: `IncidentStatusBadge`, `IncidentCard`, `IncidentList`. — 2026-06-28
- [x] Bước 5 — Customer screens: segment trong `(tabs)/alerts.tsx`, `incidents/[id].tsx` (read-only), đăng ký layout. — 2026-06-28

> **Thay đổi nhỏ (B6):** thêm hook `src/features/batteries/hooks/useAlerts.ts` (generic list all alerts) — vì `useMyAlerts` scope theo pin Customer, Staff cần list toàn bộ cho segment "Cảnh báo".
- [x] Bước 6 — Staff screens: `alerts/index.tsx` (segment), `incidents/[id].tsx` (action + modal note), nút Resolve trong `alerts/[id].tsx`, entry ở tab Thông báo, đăng ký layout. — 2026-06-28
- [x] Bước 7 — Regenerate `.expo/types` (expo start :19111 rồi kill) + `npx tsc --noEmit` PASS (No errors found). — 2026-06-28

## Câu hỏi đã giải đáp
1. **Audience** → Cả Customer + Staff (khớp endpoint table 2 cột; app đã có cả 2 route group).
2. **Alerts cũ** → Coi đã xong, chỉ thêm phần thiếu (Incidents mới + alert resolve). Không refactor alert list/detail/ack hiện có.
3. **Nav wiring** → Incidents là segment/sub-tab trong màn Cảnh báo (không thêm bottom-tab mới).

## Giả định cần xác nhận khi implement
- **Staff không có màn alerts list sẵn** (chỉ vào chi tiết alert từ battery detail). → Tạo mới `(staff)/alerts/index.tsx` segmented và link từ tab "Thông báo". Nếu Leader muốn entry ở chỗ khác (dashboard) sẽ chỉnh ở Bước 6.
- **Pitfall expo-router typed routes:** route mới (`incidents/[id]`, `(staff)/alerts/index`) sẽ làm `tsc`/check-build FAIL tới khi regenerate `.expo/types` — đã đưa vào Bước 7.
