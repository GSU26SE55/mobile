# Plan — GH-23: [Mobile] Customer Battery Detail & Monitoring

## Metadata
- **Status:** REVIEWING | **Role:** Mobile | **Ngày:** 2026-06-15
- **Issue:** #23 — https://github.com/GSU26SE55/mobile/issues/23
- **Sprint:** Sprint 3 (deadline 2026-06-27)
- **Phụ thuộc:** GH-24 `[Mobile] Staff Battery View` (branch `feat/GH-24-staff-battery-view`) — tạo **base chuẩn** trong `src/features/batteries/` (battery-asset / sensor-reading / alert: enums–types–services–hooks–components, chart `react-native-svg`). GH-23 **consume base này**, không refactor lại.

## Mục tiêu
Thay màn Customer battery detail đang **giả lập** (`app/(customer)/batteries/[id].tsx` dùng `.find()` trên list) bằng detail thật + giám sát realtime + sensor readings (latest/history/chart) + alerts của pin. Đồng thời thay **mock `alertsStore`** (Zustand hardcode) đang nuôi 3 màn Customer bằng **API alerts thật** + **Acknowledge** (`PATCH /api/alerts/{id}/acknowledge` — Customer được ack alert của mình; đây là delta riêng của GH-23, GH-24 không có).

## Scope
**Trong scope:**
- Màn Customer battery detail thật — `app/(customer)/batteries/[id].tsx`: detail asset + realtime snapshot (poll 30s) + latest reading + chart sensor (svg, aggregate) + alerts của pin.
- Thay mock `alertsStore` → real alerts trên các surface Customer:
  - `(tabs)/alerts.tsx` — list alerts của Customer (real `GET /api/alerts`).
  - `alerts/[id].tsx` — alert detail thật + nút **Acknowledge** (`PATCH /api/alerts/{id}/acknowledge`).
  - `(tabs)/dashboard.tsx` — badge/đếm alert lấy từ query thật thay vì store mock.
- Hook **Acknowledge** (Customer mutation) + bổ sung `acknowledge` vào alert service base.
- Xóa `src/stores/alertsStore.ts` (mock) sau khi cắt hết tham chiếu.

**Ngoài scope:**
- Refactor base `features/batteries/` (đã thuộc GH-24) — chỉ consume.
- Màn Staff battery/alert (GH-24).
- `resolve` alert (chỉ Admin/Manager/Staff), CRUD/transfer/threshold battery.
- Ambient readings & environmental incidents (site-level), Sites detail.
- Cài Victory Native / package mới (dùng `react-native-svg` sẵn có theo GH-24).

## Endpoints
| Method | Path | Mục đích / Response |
|--------|------|---------------------|
| GET | `/api/battery-assets/{id}` | Detail asset — `CommonResponse<BatteryAssetDto>` |
| GET | `/api/battery-assets/{id}/realtime` | Snapshot realtime (poll 30s) — `CommonResponse<BatteryAssetRealtimeDto>` |
| GET | `/api/sensor-readings/{batteryAssetId}/latest` | Reading mới nhất — `CommonResponse<SensorReadingDto>` |
| GET | `/api/sensor-readings/{batteryAssetId}/aggregate?from&interval` | Chart dài hạn — `CommonResponse<SensorReadingAggregateDto[]>` |
| GET | `/api/alerts?batteryAssetId=&pageNumber&pageSize` | Alerts của pin / của Customer — `PaginationResponse<AlertDto>` |
| GET | `/api/alerts/{id}` | Alert detail — `CommonResponse<AlertDto>` |
| PATCH | `/api/alerts/{id}/acknowledge` | Customer ack alert — `isSuccess=true` (409 nếu Resolved/Merged) |

> `history` (infinite scroll) nằm trong base GH-24; GH-23 chỉ dùng `aggregate` cho chart + `latest` cho snapshot số (giữ scope gọn). Có thể thêm history list sau nếu cần.

## Files
> Quy ước: **(GH-24 base)** = giả định đã tồn tại từ GH-24, GH-23 chỉ import. **modify/create/delete** = thay đổi của GH-23.

| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/batteries/enums/alert.enum.ts` | (GH-24 base) | `AlertSeverityEnum`, `AlertStatusEnum`, `AnomalyTypeEnum` |
| `src/features/batteries/enums/battery.enum.ts` | (GH-24 base) | `BatteryStatusEnum` (Decommissioned:3), `WarrantyStatusEnum`, `ChargingStateEnum` |
| `src/features/batteries/types/{battery,sensor-reading,alert}.types.ts` | (GH-24 base) | DTOs đầy đủ |
| `src/lib/endpoints.ts` | modify | Bổ sung `ALERTS.ACKNOWLEDGE` nếu GH-24 chưa thêm (GH-24 read-only) |
| `src/lib/queryKeys.ts` | (GH-24 base) | `batteryAssets.realtime`, `sensorReadings.*`, `alerts.*` |
| `src/features/batteries/services/alert.service.ts` | modify | Thêm method `acknowledge(id)` vào service base |
| `src/features/batteries/hooks/useAcknowledgeAlert.ts` | create | `useMutation` ack → invalidate alert list + detail + dashboard count |
| `src/features/batteries/hooks/useAlerts.ts` | create | List alerts (params: batteryAssetId?, pageSize) — cho tab + section trong detail |
| `src/features/batteries/hooks/useAlert.ts` | (GH-24 base) | Alert detail |
| `src/features/batteries/hooks/{useBatteryAsset,useBatteryAssetRealtime,useLatestReading,useReadingAggregate}.ts` | (GH-24 base) | Consume |
| `src/features/batteries/components/{BatteryInfoCard,BatteryRealtimeCard,SensorChart,AssetAlertList}.tsx` | (GH-24 base) | Reuse trong màn Customer |
| `app/(customer)/batteries/[id].tsx` | modify | Rewrite: detail thật + realtime + latest + chart + alerts của pin (bỏ `.find()`) |
| `app/(customer)/(tabs)/alerts.tsx` | modify | Dùng `useAlerts` thật thay `useAlertsStore` |
| `app/(customer)/alerts/[id].tsx` | modify | Dùng `useAlert` + `useAcknowledgeAlert` thật |
| `app/(customer)/(tabs)/dashboard.tsx` | modify | Đếm alert từ `useAlerts` thật; bỏ `useAlertsStore` |
| `src/stores/alertsStore.ts` | delete | Mock — xóa sau khi cắt hết tham chiếu |

## Enums
| Enum | File nguồn | Ghi chú |
|------|-----------|---------|
| BatteryStatusEnum | `features/batteries/enums/battery.enum.ts` | (GH-24) `Active:1, Inactive:2, Decommissioned:3` — KHÔNG còn `Failed` |
| WarrantyStatusEnum, ChargingStateEnum | `features/batteries/enums/battery.enum.ts` | (GH-24) |
| AlertSeverityEnum, AlertStatusEnum, AnomalyTypeEnum | `features/batteries/enums/alert.enum.ts` | (GH-24) |

## Types (consume từ GH-24 base; tham chiếu `api-battery.md`)
```ts
// BatteryAssetDto: id, serialNumber, batteryTypeId/Name, siteId/Name, customerId/Name,
//   installDate, warrantyEndDate, warrantyStatus, location, lat/long, status, notes, lastSensorReadingAt, createdAt
// BatteryAssetRealtimeDto: assetId, serialNumber, status, time?, voltage?, current?, temperature?,
//   socPercent?, cycleCount?, sohPercent?, chargingState?, activeAlerts
// SensorReadingDto: time, batteryAssetId, voltage, current, temperature, socPercent, cycleCount?, sourceDeviceId?
// SensorReadingAggregateDto: time, avgVoltage, avgCurrent, avgTemperature, avgSocPercent, avgSohPercent?
// AlertDto: id, batteryAssetId, batterySerialNumber, anomalyType, severity, thresholdValue, actualValue,
//   unit, detectedAt, status, ticketId?, acknowledgedByUserId?, acknowledgedAt?, resolvedAt?, dedupWindowEndUtc, createdAt
```

## Approach
- **Không gọi API trong component** — qua `services/` → TanStack Query hook (consume base GH-24).
- **Realtime:** `useBatteryAssetRealtime` `staleTime:0 + refetchInterval:30_000` (base GH-24).
- **Chart:** reuse `SensorChart` (svg, base GH-24), range 24h interval `1h` từ `aggregate`.
- **Alerts thật:** `useAlerts({ batteryAssetId })` cho section trong detail; `useAlerts()` (không filter) cho tab Customer. Mặc định `excludeMerged=true`.
- **Acknowledge:** `useAcknowledgeAlert` → `onSuccess` invalidate `QUERY_KEY.alerts.list` + `alerts.detail(id)`; `onError` `handleErrorApi` (toast — non-form). Disable nút khi `status !== Open`.
- **Phân biệt 0 vs null:** SOC/voltage/temp = `0` hợp lệ → check `!= null`, không dùng truthy.
- **Cắt mock:** thay `useAlertsStore` ở 3 màn → xóa `alertsStore.ts`.

## Workflow
**Battery detail:**
  Mở `batteries/[id].tsx` → `useBatteryAsset(id)` + `useBatteryAssetRealtime(id)` + `useLatestReading(id)` + `useReadingAggregate(id,{hours:24,interval:'1h'})` + `useAlerts({batteryAssetId:id})`
  → render BatteryInfoCard + BatteryRealtimeCard + SensorChart + AssetAlertList
  → tap alert → `alerts/[id]`

**Acknowledge:**
  `alerts/[id]` → `useAlert(id)` → nút Acknowledge (chỉ khi `status===Open`)
  → `useAcknowledgeAlert.mutate(id)`
  → OK: invalidate list+detail → UI cập nhật `Acknowledged`
  → FAIL (409 Resolved/Merged): `handleErrorApi` toast

## Edge Cases
- Battery 404 / `id` rỗng → empty state + nút back (không crash).
- Chưa có reading (realtime field null, `time` null) → placeholder "—".
- Aggregate rỗng → chart empty state; alerts rỗng → "Không có cảnh báo".
- SOC/temp/current `= 0` hợp lệ → check `!= null`, không bỏ qua.
- Acknowledge alert đã `Resolved`/`Merged` → 409 → toast, không đổi UI.
- Lỗi mạng / 401 → axios interceptor xử lý (refresh/logout).

## Acceptance Criteria
- [ ] `batteries/[id].tsx` gọi detail endpoint thật (không `.find()`), hiển thị đủ field asset.
- [ ] Realtime snapshot auto-refresh ~30s; field null → placeholder.
- [ ] Hiển thị latest reading + chart sensor (svg) từ aggregate 24h.
- [ ] Alerts của pin hiển thị trong màn detail; tap → alert detail.
- [ ] Customer acknowledge được alert `Open` của mình; alert `Resolved/Merged` không ack được (toast).
- [ ] `(tabs)/alerts.tsx`, `alerts/[id].tsx`, `(tabs)/dashboard.tsx` dùng API thật; `alertsStore.ts` đã xóa.
- [ ] Không gọi API trong component; không thêm package; `npx tsc --noEmit` PASS.

## Steps
- [x] Bước 1 — Endpoints & alert service: thêm `ALERTS.ACKNOWLEDGE` + `acknowledge()` vào `alert.service.ts` — 2026-06-15
- [x] Bước 2 — Hooks: `useAlerts` (list params), `useAcknowledgeAlert` (mutation + invalidate) — 2026-06-15
- [x] Bước 3 — Màn `batteries/[id].tsx`: rewrite dùng base hooks + components (detail+realtime+chart+alerts+CTA ticket) — 2026-06-15
- [x] Bước 4 — Màn alerts: `(tabs)/alerts.tsx` + `alerts/[id].tsx` chuyển sang API thật + acknowledge — 2026-06-15
- [x] Bước 5 — `(tabs)/dashboard.tsx`: alert count (status Open) từ query thật; gỡ `useAlertsStore` — 2026-06-15
- [x] Bước 6 — Xóa `src/stores/alertsStore.ts`; `npx tsc --noEmit` PASS — 2026-06-15

## Deviations (so với plan ban đầu)
- **Enum fix:** `BatteryStatusEnum.Failed:3` → `Decommissioned:3` (đúng `api-battery.md`, GH-24 sót). Kéo theo sửa label ở `BatteryInfoCard.tsx` (base), `profile.tsx`, `CreateTicketStepper.tsx` ('Failed' → 'Ngừng sử dụng').
- **`profile.tsx`:** cũng dùng mock `alertsStore` (count) → migrate sang `useAlerts` (status Open). Không có trong Files ban đầu nhưng bắt buộc để xóa được store.
- **eslint:** 1 warning `react-hooks/exhaustive-deps` ở `dashboard.tsx` là **pre-existing** (animation trong `EnergyFlowDiagram`), không thuộc scope GH-23 → giữ nguyên.
- **[Review fix] Alert scoping:** BE `GET /api/alerts` KHÔNG scope theo Customer (đã đọc `GetAlertsQueryHandler`) → đổi `useAlerts` (list toàn cục, rò rỉ) thành `useMyAlerts` (gộp alert theo từng pin Customer sở hữu) ở tab/dashboard/profile; xóa `useAlerts.ts`. Khuyến nghị BE thêm server-side scope (issue riêng).

## Câu hỏi đã giải đáp
- **Chart lib?** → `react-native-svg` (đã chốt ở GH-24, không thêm Victory Native).
- **Alerts code đặt đâu?** → trong `src/features/batteries/` (base role-independent của GH-24).
- **Refactor base?** → GH-24 đảm nhiệm; GH-23 chỉ consume + thêm Customer delta (acknowledge, screens).
- **Phụ thuộc GH-24 chưa merge?** → Viết plan trước; branch `feat/GH-23-*` tạo lúc implement (sau khi GH-24 base có sẵn).
- **Mock alertsStore?** → Thay hết bằng API thật trên cả 3 màn Customer + xóa store (đúng tinh thần "refactor cho chuẩn"). *Cần xác nhận lúc approve nếu muốn thu hẹp.*
