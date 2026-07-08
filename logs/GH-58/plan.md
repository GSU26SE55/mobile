# Plan — GH-58: [Mobile] Battery Realtime Telemetry (Staff + Customer)

## Metadata
- **Status:** REVIEWING | **Role:** Mobile | **Ngày:** 2026-06-28
- **Issue:** #58 — https://github.com/GSU26SE55/mobile/issues/58
- **Sprint:** Sprint 4 (due 2026-07-11)

## Mục tiêu
Bổ sung **realtime telemetry nhiều pin cùng lúc** (event SSE `summary`) cho Mobile — phần mà GH-57 **đẩy ra ngoài scope**. Cho phép màn **danh sách nhiều pin** (Customer dashboard, Staff customer-detail) hiển thị số đo live (SOC/voltage/temp…) cập nhật ~4s, thay vì chỉ giá trị tĩnh từ REST list.

> ⚠️ **Đây là scope đã được lược trùng (hướng A).** Mọi phần đã có ở plan khác đã được gỡ khỏi GH-58 — xem mục "Đã lược (làm ở issue khác)".

## Scope

**Trong scope (net-new — KHÔNG trùng issue nào):**
- SSE **summary** stream layer cho scope **nhiều pin**:
  - **Customer:** `customer:{chính mình}` (mặc định) — mọi pin của khách.
  - **Staff:** `assets:{id1,…}` (≤ 50 id) — các pin của 1 khách đang xem.
- Hook `useBatteryFleetStream(scope)` — parse event `summary` (`items[]: LiveReadingDto`), lọc `primary`, trả `Map<batteryAssetId, LiveReadingDto>`. **Hỗ trợ sẵn cả `customer:` lẫn `assets:`** (reusable).
- Wire giá trị live vào màn list nhiều pin GH-57 KHÔNG đụng:
  - `app/(customer)/(tabs)/dashboard.tsx` → `BatteryCard` overlay SOC/voltage/temp live (scope `customer:{accountId}`).

**Ngoài scope:**
- **Wire UI Staff (`assets:{ids}`)** — Staff **không có màn list nhiều pin** (`(staff)/customers/[customerId]` là list TICKET, không phải pin; `(staff)/batteries/[id]` là chi tiết 1 pin → GH-57 lo). Hook đã hỗ trợ `assets:` nhưng **chưa wire UI** vì không có host. Để issue sau khi có màn Staff multi-pin (quyết định 2026-06-28 lúc implement).
- Single-asset SSE (`asset:{id}`, event `reading`) + polling fallback ở Battery detail → **GH-57**.
- 3 REST `latest/history/aggregate` → **GH-23/GH-24** (đã ở `dev`).
- Cài `react-native-sse`, endpoint `STREAM` entry, type `LiveReadingDto` cơ bản → **GH-57** (GH-58 reuse).
- Scope `site`/`sites`/`type`/`all`/`site:none` → chỉ Admin/Manager, **không khả dụng trên mobile**.
- Màn live dashboard riêng / redesign UI.

## Đã lược (làm ở issue khác — KHÔNG làm lại trong GH-58)
| Phần | Issue làm | Trạng thái |
|------|-----------|-----------|
| REST `latest` / `history` / `aggregate` (service + hook + type) | #23, #24 | đã ở `dev` |
| SSE single `asset:{id}` (event `reading`) + merge cache + polling fallback ở Battery detail | #57 | implementing |
| `npm i react-native-sse` + SSE connect base + `?access_token=` | #57 (step B4) | implementing |
| `endpoints.ts → SENSOR_READINGS.STREAM` entry | #57 (step B1) | implementing |
| Type `LiveReadingDto` (SSE reading payload, 19 field) | #57 (step B2 "live-reading") | implementing |

## Dependencies
- **Phụ thuộc GH-57:** GH-58 reuse `react-native-sse`, `endpoints STREAM`, `LiveReadingDto`, và cách mở SSE (`?access_token=`) từ GH-57. → **Branch GH-58 nên tách SAU khi GH-57 merge vào `dev`** (hoặc rebase lên GH-57). Nếu phần nào GH-57 chưa tạo lúc bắt đầu → GH-58 tạo và GH-57 reuse (phối hợp vì cùng dev @Shu1237).
- Nếu GH-57 tách sẵn helper mở SSE connection → GH-58 reuse; nếu chưa → GH-58 tự mở connection trong hook (boilerplate nhỏ, không refactor code GH-57).

## Endpoints (reuse — KHÔNG thêm mới)
| Method | Path | Scope GH-58 dùng | Event |
|--------|------|------------------|-------|
| GET (SSE) | `/api/sensor-readings/stream?scope=&access_token={JWT}` | `customer:{accountId}` (Customer) · `assets:{ids}` (Staff) | `summary`, `ping` |

> Contract verified từ backend `SensorTelemetryStreamController.cs` + `TelemetryScope.cs` + `BatteryRealtimeAuthorizationService.cs`. Auth: Customer chỉ `customer:{chính mình}` / `assets:{pin sở hữu}`; Staff `assets:{bất kỳ}`, **KHÔNG** `customer/site/type/all/site:none`.

### Bằng chứng contract — `customer:{self}` resolve thế nào (điểm dễ 403 nhất)
Trích `BatteryRealtimeAuthorizationHelper.cs`:
```csharp
public static bool CanAccessCustomer(Guid customerId, Guid actorUserId, IReadOnlyCollection<string> roles)
    => IsManagerOrAdmin(roles) || (HasRole(roles, "Customer") && customerId == actorUserId);
```
Và `asset` ownership (`BatteryRealtimeAuthorizationService.cs`): `owners.All(customerId => customerId == actorUserId)` — tức `BatteryAsset.CustomerId == actorUserId`. `actorUserId` = JWT `UserId`/`NameIdentifier`/`AccountId` (`SensorTelemetryStreamController.TryGetUserId`).

→ Trong hệ này **`BatteryAsset.CustomerId == JWT AccountId của khách`**. Mobile `SessionUser.accountId` = `JWT.AccountId`, nên **FE truyền `customer:{sessionUser.accountId}`** là đúng — BE so khớp `customerId == actorUserId` (chính nó). KHÔNG dùng field `customerId` trong reading payload để dựng scope (đó là dữ liệu, không phải id cần truyền). Đây là lý do `customer:{self}` không bị 403.

## Types (reuse + thêm summary)
| Type | File | Action |
|------|------|--------|
| `LiveReadingDto` (19 field SSE, null bị lược → field vắng = null) | `features/batteries/types/live-reading.types.ts` | reuse GH-57 (tạo nếu chưa có) |
| `BatterySummaryDto` `{ scopeType: string; items: LiveReadingDto[] }` | `features/batteries/types/live-reading.types.ts` | **create** (GH-57 không cần summary) |

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/batteries/types/live-reading.types.ts` | create/modify | thêm `BatterySummaryDto` (reuse `LiveReadingDto`) |
| `src/features/batteries/hooks/useBatteryFleetStream.ts` | create | mở SSE scope multi-pin, parse `summary`, lọc `primary`, trả `Map<assetId, LiveReadingDto>` |
| `src/features/batteries/utils/buildFleetScope.ts` | create | dựng scope theo role: Customer `customer:{accountId}` (1 id, KHÔNG cap pin) / Staff `assets:{ids}` (cap **50 — chỉ áp cho `assets:`**) |
| `app/(customer)/(tabs)/dashboard.tsx` | modify | mở `useBatteryFleetStream(customer:{accountId})`; `BatteryCard` nhận prop `live?` overlay SOC/V/temp, fallback giá trị tĩnh |
| ~~`app/(staff)/customers/[customerId].tsx`~~ | ~~modify~~ | **bỏ** — màn này là list ticket, không phải pin; Staff không có host multi-pin (xem Ngoài scope) |

## Approach
- **Hook `useBatteryFleetStream(scope)`**: mở 1 SSE connection (reuse pattern GH-57, `?access_token=`), lắng nghe event `summary` → với mỗi `item` lọc `sensorSourceCode === 'primary'` hoặc vắng → cập nhật `Map<batteryAssetId, LiveReadingDto>` trong state. `ping` → bỏ qua (heartbeat). **`scopeType` trong payload → BỎ QUA** (route bằng `batteryAssetId` của từng item, không normalize theo `scopeType`). Không quản state bằng TanStack Query (SSE push, không phải query).
- **Xử lý lỗi (KHÔNG nuốt im lặng — §8 SSE):** event `error` của `react-native-sse` mang status HTTP (`xhrStatus`). Phân nhánh:
  - **401/403** (sai auth/scope — lỗi *trước khi* mở stream) → `console.warn` rõ status + scope, set cờ `streamError` (để debug/ẩn badge live), **KHÔNG** auto-retry mù (sẽ 403 lại).
  - **Network / đóng sau khi mở** → giữ Map cũ, để lib tự reconnect (BE không replay → `summary` kế seed lại).
  - Mọi nhánh: cards vẫn hiển thị giá trị tĩnh từ list REST (không treo). Phân biệt với "đang chờ data" qua cờ `streamError`/`hasReceivedSummary`.
- **Token qua query:** `encodeURIComponent(accessToken)` khi ghép `?access_token=` (JWT base64url thường URL-safe, nhưng encode cho chắc nếu token chứa `+`/`=`).
- **Scope theo role** (`buildFleetScope`): Customer → `customer:{accountId}` (mọi pin của mình, **1 id, không cap số pin**). Staff → `assets:{ids}` từ list pin đang hiển thị (**cap 50 chỉ cho `assets:`**; > 50 → cắt 50 đầu + `console.warn`). Đọc `role`/`accountId` từ `sessionStore`.
- **Merge tại UI**: giá trị tĩnh từ `useMyBatteryAssets()` / staff list là nền; live Map đè field telemetry theo `batteryAssetId`. Field vắng (null) → giữ giá trị tĩnh / "—". Không đè `serialNumber/status` (summary không mang).
- **Lifecycle**: mở stream khi màn focus + có ≥1 pin; đóng khi blur/unmount (tránh leak). Customer dashboard: 1 stream `customer:{self}`. Staff customer-detail: 1 stream `assets:{ids của khách đó}`.

## Edge Cases
- `Realtime:Enabled=false` → chỉ `ping`, không `summary` → cards giữ giá trị tĩnh REST, **không treo** (phân biệt với lỗi qua cờ `streamError`).
- **Sai scope/sai quyền → HTTP 401/403 trước khi mở stream (§8 SSE):** `react-native-sse` `error` event có `xhrStatus` → `console.warn` status + scope, set `streamError`, **không** retry mù. KHÔNG nuốt im lặng.
- Reconnect không replay (BE không gắn `id:`) → sau reconnect Map rỗng tạm thời → vẫn show giá trị tĩnh tới khi `summary` kế tới (list đã có giá trị tĩnh nên không cần re-seed REST riêng).
- Field null bị lược khỏi JSON → coi vắng = null, không ghi đè giá trị tĩnh bằng `undefined` (giữ giá trị tĩnh hoặc "—").
- **Cap 50 chỉ cho `assets:` (Staff).** Customer `customer:{accountId}` nhận đúng 1 id → không giới hạn số pin (BE: `customer:` 1 id). Staff > 50 pin/khách (hiếm) → cắt 50 + warn.
- `summary.items` gồm nhiều `sensorSourceCode` cùng 1 pin → chỉ lấy `primary`/vắng, bỏ `redundant`/`external-temp`.
- Token hết hạn giữa stream → SSE đóng (error) → giữ giá trị tĩnh; lần focus sau mở lại với token mới (`encodeURIComponent`).
- Pin trong Map nhưng không còn trong list tĩnh → bỏ qua (không render thừa); route theo `batteryAssetId`, KHÔNG dùng `scopeType`.

## Acceptance Criteria
- [ ] Customer dashboard: mỗi `BatteryCard` hiển thị SOC/voltage/temperature **live** cập nhật ~4s qua scope `customer:{accountId}` (event `summary`).
- [ ] Hook `useBatteryFleetStream` hỗ trợ cả `customer:` và `assets:` (reusable cho Staff sau này — chưa wire UI vì không có host).
- [ ] Field null/vắng → giữ giá trị tĩnh hoặc "—", không crash; SOC/temp = 0 vẫn hiển thị (phân biệt 0 vs null).
- [ ] `Realtime:Enabled=false` (chỉ `ping`) → cards vẫn hiện giá trị tĩnh, không treo chờ.
- [ ] Stream đóng đúng khi rời màn (không leak connection); chỉ lấy source `primary`.
- [ ] Sai scope/403 → `console.warn` status (KHÔNG nuốt im lặng), không retry mù; cards vẫn show giá trị tĩnh.
- [ ] Customer dùng `customer:{accountId}` (không cap pin); chỉ Staff cap 50 cho `assets:`.
- [ ] **KHÔNG** trùng code GH-57/GH-23/GH-24: không thêm lại REST hook, không đụng single-asset SSE ở Battery detail, không cài lại package.
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` PASS (sau regenerate `.expo/types` nếu thêm route).

## Steps
- [x] B1: Types — thêm `BatterySummaryDto` vào `live-reading.types.ts` (reuse `LiveReadingDto` GH-57) — 2026-06-28
- [x] B2: Util — `buildFleetScope(role, { accountId, assetIds })` (Customer `customer:{accountId}` không cap / Staff `assets:{ids}` cap 50) — 2026-06-28
- [x] B3: Hook — `useBatteryFleetStream(scope)` parse `summary` + lọc `primary` → `Map<assetId, LiveReadingDto>`, xử lý `error` event (log 401/403, đóng, không retry mù), `encodeURIComponent(token)` — 2026-06-28
- [x] B4: Wire Customer dashboard `BatteryCard` live (scope `customer:{accountId}`) — 2026-06-28
- [x] B5: ~~Wire Staff battery list~~ — **BỎ** (Staff không có màn list nhiều pin; hook đã hỗ trợ `assets:` cho tương lai) — 2026-06-28
- [x] B6: `tsc --noEmit` PASS toàn repo; `eslint` 3 file GH-58 sạch 0 warning — 2026-06-28
  - ⚠️ 1 warning pre-existing `dashboard.tsx:85` (`EnergyFlowDiagram` thiếu dep `progress`) — đã có trên HEAD base, KHÔNG đụng (Surgical Changes).

## Câu hỏi đã giải đáp
- **Đọc 2 repo `backend` + `iot_simulator`** xác minh contract SSE thật (controller/scope/authz, payload `LiveReadingDto` + `BatterySummaryDto`).
- **Xung đột với GH-57** (đang implementing, cùng Sprint 4, cùng dev): GH-57 đã cover single `asset:{id}` SSE + polling fallback ở Battery detail. Chốt **hướng A** — GH-58 chỉ giữ phần multi-pin `summary` (GH-57 đẩy ra ngoài scope), lược toàn bộ phần trùng.
- **3 REST endpoint** đã làm ở #23/#24 (verified ở `dev`) → gỡ khỏi GH-58.
- **SSE lib** `react-native-sse` (đã approve GH-57) — GH-58 reuse, không cài lại.

### Sửa theo review (2026-06-28)
- **[CAO] `customer:{accountId}` đúng** — verified `CanAccessCustomer`: BE check `customerId == actorUserId` (JWT id); `BatteryAsset.CustomerId == JWT AccountId` → FE truyền `customer:{sessionUser.accountId}`. Đã trích code vào mục Endpoints.
- **[CAO] Không nuốt 4xx** — thêm xử lý `error` event: log status 401/403 (lỗi trước khi mở stream, §8), không retry mù; phân biệt với "đang chờ data" qua cờ `streamError`.
- **[TB] Cap 50** — làm rõ chỉ áp cho `assets:` (Staff); `customer:{accountId}` 1 id không giới hạn pin.
- **Gaps** — `encodeURIComponent(token)` cho query; bỏ qua `scopeType` (route bằng `batteryAssetId`).
