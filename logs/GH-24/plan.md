# Plan — GH-24: [Mobile] Staff Battery View

## Metadata
- **Status:** REVIEWING | **Role:** FE (Mobile) | **Ngày:** 2026-06-14
- **Issue:** #24 — https://github.com/GSU26SE55/mobile/issues/24
- **Sprint:** Sprint 3 (deadline 2026-06-27)
- **Reference chuẩn:** `docs/api-battery.md` (API contract) + `/Users/shu/Documents/GSU26SE55/frontend` (cấu trúc FE: service/types/hook tách lớp)

## Mục tiêu
Cho **Staff** xem thông tin pin **read-only** của ticket được giao (từ `ticket.batteryAssetId`): detail asset + realtime snapshot + sensor readings (latest/history/chart) + alerts của asset. Đồng thời **refactor `src/features/batteries/` thành cấu trúc chuẩn** (mirror FE: `battery-asset` / `sensor-reading` / `alert` tách service–types–hook) để Customer Battery (issue song song) reuse chung base.

## Scope
**Trong scope:**
- **Shared battery base (refactor cho chuẩn):** mở rộng types/services/hooks/enums theo `docs/api-battery.md` — dùng chung cho cả Staff + Customer.
  - Battery detail — `GET /api/battery-assets/{id}`
  - Realtime snapshot — `GET /api/battery-assets/{id}/realtime` (poll 30s)
  - Sensor readings — `latest` + `history` + `aggregate` (chart) — `GET /api/sensor-readings/{batteryAssetId}/*`
  - Alerts của asset — `GET /api/alerts?batteryAssetId=` (list) + `GET /api/alerts/{id}` (detail) — **read-only**
- **Màn Staff Battery View** — route mới `app/(staff)/batteries/[id].tsx` lắp ráp các component shared.
- **Màn Staff Alert Detail** — route mới `app/(staff)/alerts/[id].tsx` (read-only).
- **Entry point:** thêm nút/card "Xem pin" trong `app/(staff)/tickets/[id].tsx` → `router.push` battery view với `ticket.batteryAssetId`.
- **Chart:** vẽ bằng `react-native-svg` sẵn có (không thêm package).

**Ngoài scope:**
- Mọi thao tác sửa battery (CRUD admin) — Staff chỉ xem.
- Acknowledge / Resolve alert (Staff có quyền `resolve` nhưng không thuộc view này).
- Browse toàn bộ battery list không gắn ticket.
- Refactor màn Customer battery `app/(customer)/batteries/[id].tsx` — để issue Customer Battery song song tự rá́p UI (base mới đã sẵn để reuse).
- Sửa `alertsStore` mock của Customer alerts (không động tới).
- Cài Victory Native / thêm package mới.

## Endpoints
| Method | Path | Mục đích / Response |
|--------|------|---------------------|
| GET | `/api/battery-assets/{id}` | Detail asset — `CommonResponse<BatteryAssetDto>` |
| GET | `/api/battery-assets/{id}/realtime` | Snapshot realtime — `CommonResponse<BatteryAssetRealtimeDto>` |
| GET | `/api/sensor-readings/{batteryAssetId}/latest` | Reading mới nhất — `CommonResponse<SensorReadingDto>` |
| GET | `/api/sensor-readings/{batteryAssetId}/history` | Lịch sử (cursor) — `CommonResponse<SensorReadingHistoryResponseDto>` |
| GET | `/api/sensor-readings/{batteryAssetId}/aggregate` | Bucket cho chart — `CommonResponse<SensorReadingAggregateDto[]>` |
| GET | `/api/alerts?batteryAssetId=&pageSize=` | Alerts của asset — `PaginationResponse<AlertDto>` |
| GET | `/api/alerts/{id}` | Alert detail — `CommonResponse<AlertDto>` |

> `batteryAssetId` chỉ truyền qua **path** cho sensor-readings (bỏ qua query param trùng tên trong Swagger). `aggregate` interval mặc định `1h`; luôn truyền `from`/`to` để giới hạn scan TimescaleDB.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/endpoints.ts` | modify | Thêm `BATTERY_ASSETS` (DETAIL, REALTIME, MY), `SENSOR_READINGS` (LATEST/HISTORY/AGGREGATE), `ALERTS` (LIST/DETAIL). Migrate `BATTERIES.MY_ASSETS` → `BATTERY_ASSETS.MY`, bỏ `BATTERIES.LIST/DETAIL` (legacy `/api/batteries` sai) |
| `src/lib/queryKeys.ts` | modify | Thêm KEY `batteryAssets`, `sensorReadings`, `alerts` + factories (detail/realtime/me, latest/history/aggregate, list/detail) |
| `src/shared/enums/alert.enum.ts` | create | `AlertSeverityEnum`, `AlertStatusEnum`, `AnomalyTypeEnum` (`as const`) |
| `src/features/batteries/enums/battery.enum.ts` | modify | Thêm `WarrantyStatusEnum`, `ChargingStateEnum` |
| `src/features/batteries/types/battery.types.ts` | modify | Mở rộng `BatteryAssetDto` (full fields theo doc) + `BatteryAssetRealtimeDto` + `BatteryAssetListParams`; re-export enums |
| `src/features/batteries/types/sensor-reading.types.ts` | create | `SensorReadingDto`, `SensorReadingHistory*`, `SensorReadingAggregate*`, `SensorReadingInterval` |
| `src/features/batteries/types/alert.types.ts` | create | `AlertDto`, `AlertListParams` (re-export alert enums) |
| `src/features/batteries/services/battery.service.ts` | modify | Giữ `getMyAssets`; thêm `getById`, `getRealtime` |
| `src/features/batteries/services/sensor-reading.service.ts` | create | `getLatest`, `getHistory`, `getAggregate` |
| `src/features/batteries/services/alert.service.ts` | create | `getList`, `getById` (read-only — không ack/resolve) |
| `src/features/batteries/hooks/useBatteryAsset.ts` | create | Detail by id |
| `src/features/batteries/hooks/useBatteryAssetRealtime.ts` | create | `staleTime:0`, `refetchInterval:30_000` |
| `src/features/batteries/hooks/useSensorReadingLatest.ts` | create | Latest reading |
| `src/features/batteries/hooks/useSensorReadingHistory.ts` | create | History (limit 100, from/to) |
| `src/features/batteries/hooks/useSensorReadingAggregate.ts` | create | Aggregate cho chart (default 24h, interval `1h`) |
| `src/features/batteries/hooks/useAssetAlerts.ts` | create | List alert theo `batteryAssetId` |
| `src/features/batteries/hooks/useAlert.ts` | create | Alert detail by id |
| `src/features/batteries/hooks/useMyBatteryAssets.ts` | modify | Đổi sang `BATTERY_ASSETS.MY` + key `batteryAssets.me` |
| `src/features/batteries/components/BatteryRealtimeCard.tsx` | create | Snapshot: status, V/A/temp/SOC/SOH/charging, activeAlerts |
| `src/features/batteries/components/BatteryInfoCard.tsx` | create | Static detail: serial, type, site, warranty, installDate |
| `src/features/batteries/components/SensorChart.tsx` | create | Line chart (svg) SOC/Voltage/Temp từ aggregate |
| `src/features/batteries/components/AssetAlertList.tsx` | create | Danh sách alert (severity/anomaly/detectedAt) → tap mở detail |
| `app/(staff)/batteries/[id].tsx` | create | Màn Staff Battery View — lắp ráp component |
| `app/(staff)/alerts/[id].tsx` | create | Màn Alert Detail (read-only) |
| `app/(staff)/tickets/[id].tsx` | modify | Thêm card "Xem pin" → `router.push('/(staff)/batteries/[id]', { id: ticket.batteryAssetId })` (chỉ khi `batteryAssetId != null`) |

## Enums
| Enum | File nguồn | Action |
|------|-----------|--------|
| BatteryStatusEnum | `features/batteries/enums/battery.enum.ts` | đã có |
| WarrantyStatusEnum | `features/batteries/enums/battery.enum.ts` | thêm (Active=1, Expired=2, Void=3) |
| ChargingStateEnum | `features/batteries/enums/battery.enum.ts` | thêm (Idle=1, Charging=2, Discharging=3, Float=4, Bypass=5) |
| AlertSeverityEnum | `shared/enums/alert.enum.ts` | tạo (Info=1, Warning=2, Critical=3) |
| AlertStatusEnum | `shared/enums/alert.enum.ts` | tạo (Open=1, Acknowledged=2, Merged=3, Resolved=4) |
| AnomalyTypeEnum | `shared/enums/alert.enum.ts` | tạo (15 type theo doc) |

## Types (shape ngắn gọn — mirror FE + doc)
```ts
interface BatteryAssetDto {
  id; serialNumber; batteryTypeId; batteryTypeName;
  siteId: string|null; siteName: string|null;
  customerId; customerName; installDate;
  warrantyEndDate: string|null; warrantyStatus: WarrantyStatusEnum;
  location: string|null; latitude: number|null; longitude: number|null;
  status: BatteryStatusEnum; notes: string|null;
  lastSensorReadingAt: string|null; createdAt;
}
interface BatteryAssetRealtimeDto {
  assetId; serialNumber; status: BatteryStatusEnum;
  time: string|null; voltage|current|temperature|socPercent: number|null;
  cycleCount: number|null; sohPercent: number|null;
  chargingState: ChargingStateEnum|null; activeAlerts: number;
}
interface SensorReadingDto { time; batteryAssetId; voltage; current; temperature; socPercent; cycleCount: number|null; sourceDeviceId: string|null; }
interface SensorReadingHistoryResponseDto { items: SensorReadingDto[]; nextCursor: string|null; hasMore: boolean; }
interface SensorReadingAggregateDto { time; avgVoltage; avgCurrent; avgTemperature; avgSocPercent; avgSohPercent: number|null; }
interface AlertDto { id; batteryAssetId; batterySerialNumber; anomalyType; severity; thresholdValue; actualValue; unit; detectedAt; status; ticketId?: string|null; acknowledgedAt?: string|null; resolvedAt?: string|null; dedupWindowEndUtc; createdAt; }
```

## Schema (Zod)
Không có — view **read-only**, không có form input. Bỏ qua section schema.

## Approach
- **Tách lớp chuẩn (mirror FE):** mỗi domain (`battery-asset`, `sensor-reading`, `alert`) có service → hook TanStack Query → component. Component/screen không gọi API trực tiếp.
- **Realtime:** `useBatteryAssetRealtime` dùng `staleTime:0 + refetchInterval:30_000` (poll), nhất quán FE.
- **Chart:** `SensorChart` nhận `SensorReadingAggregateDto[]`, tự normalize min/max → vẽ `<Polyline>`/`<Path>` bằng `react-native-svg`. Mặc định range 24h, `interval=1h`. Không có data → empty state.
- **Alerts read-only:** list theo `batteryAssetId` (mặc định `excludeMerged=true`), tap → `app/(staff)/alerts/[id]`. Không hiển thị nút ack/resolve.
- **Entry point:** trong Staff ticket detail, render card "Xem pin" chỉ khi `ticket.batteryAssetId != null`; navigate kèm `id`.
- **Reuse-ready cho Customer:** mọi component/hook đặt trong `src/features/batteries/` không phụ thuộc role → Customer screen có thể import lại.

## Edge Cases
- `batteryAssetId == null` trên ticket → ẩn card "Xem pin" (không navigate).
- Battery detail 404 / không tồn tại → empty state "Không tìm thấy pin" + nút back.
- Realtime/latest chưa có reading (các field `null`, `time=null`) → hiển thị "—" / "Chưa có dữ liệu", không crash.
- Aggregate trả mảng rỗng → chart empty state.
- `sohPercent`/`chargingState`/`cycleCount` null → field optional, render placeholder.
- Alerts rỗng → "Không có cảnh báo".
- Lỗi mạng/401 → axios interceptor xử lý refresh/logout; query `isError` → hiển thị thông báo lỗi nhẹ.
- Phân biệt 0 vs null: SOC/temp có thể = 0 hợp lệ → check `!= null`, không dùng truthy.

## Acceptance Criteria
- [ ] Từ Staff ticket detail (có `batteryAssetId`), tap "Xem pin" mở `app/(staff)/batteries/[id]`.
- [ ] Màn battery view hiển thị: detail asset (serial, type, site, warranty, status), realtime snapshot (V/A/temp/SOC/SOH/charging/activeAlerts) auto-refresh ~30s.
- [ ] Hiển thị reading mới nhất + chart sensor (SOC/Voltage/Temp) vẽ bằng svg từ aggregate.
- [ ] Hiển thị danh sách alert của asset; tap mở alert detail read-only (không có nút ack/resolve).
- [ ] Tất cả read-only — không có nút sửa/CRUD battery.
- [ ] Các trường null (chưa có reading/SOH) hiển thị placeholder, không crash.
- [ ] `npx tsc --noEmit` PASS; không thêm package mới; không gọi API trong component (chỉ qua services → hook).

## Steps
- [x] **Bước 1 — Types & Enums:** `shared/enums/alert.enum.ts`; mở rộng `battery.enum.ts`; `battery.types.ts` (full + realtime); `sensor-reading.types.ts`; `alert.types.ts`. — 2026-06-14
- [x] **Bước 2 — Endpoints & QueryKeys:** cập nhật `endpoints.ts` + `queryKeys.ts`; migrate `useMyBatteryAssets`. — 2026-06-14
- [x] **Bước 3 — Services:** mở rộng `battery.service.ts`; tạo `sensor-reading.service.ts`, `alert.service.ts`. — 2026-06-14
- [x] **Bước 4 — Hooks:** `useBatteryAsset`, `useBatteryAssetRealtime`, `useSensorReadingLatest`, `useSensorReadingHistory`, `useSensorReadingAggregate`, `useAssetAlerts`, `useAlert`. — 2026-06-14
- [x] **Bước 5 — Components:** `BatteryInfoCard`, `BatteryRealtimeCard`, `SensorChart` (svg), `AssetAlertList`. — 2026-06-14
- [x] **Bước 6 — Screens:** `app/(staff)/batteries/[id].tsx`, `app/(staff)/alerts/[id].tsx` + đăng ký vào `(staff)/_layout.tsx`. — 2026-06-14
- [x] **Bước 7 — Entry point:** thêm card "Xem pin" vào `app/(staff)/tickets/[id].tsx`. — 2026-06-14
- [x] **Bước 8 — Verify:** `npx tsc --noEmit` PASS (No errors); eslint 0 errors (chỉ baseline `no-redeclare` từ enum convention, đồng nhất codebase). — 2026-06-14

## Câu hỏi đã giải đáp
1. **Chart lib?** → Vẽ bằng `react-native-svg` sẵn có, không thêm package (tuân rule "không thêm package nếu stack đủ").
2. **Phạm vi shared base?** → Build full shared base trong issue này; Customer Battery (song song) reuse lại.
3. **Alerts data source?** → Wire real `GET /api/alerts?batteryAssetId=` (list + detail read-only); không động `alertsStore` mock của Customer.
4. **Entry point?** → Thêm card/nút "Xem pin" trong `app/(staff)/tickets/[id].tsx`.
