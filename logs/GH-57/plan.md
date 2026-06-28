# Plan — GH-57: [Mobile] Battery & Site Monitoring (M-1)

## Metadata
- **Status:** REVIEWING | **Role:** Mobile | **Ngày:** 2026-06-28
- **Issue:** #57 — https://github.com/GSU26SE55/mobile/issues/57
- **Sprint:** Sprint 4 (due 2026-07-11) | **Priority:** P2
- **Dev:** Trần Minh Trí (@Shu1237)

## Mục tiêu
Hoàn thiện luồng giám sát pin/site/môi trường trên Mobile (Customer + Staff). Phần **battery + sensor (M1/M2) đã có sẵn** trong `features/batteries/`. Việc thật của ticket là bổ sung **4 mảng mới**: Sites (M5), Ambient (M6), Cascade risk (M6), và **realtime SSE** thay/bổ trợ polling.

## Scope
**Trong scope (4 sub-feature, chung 1 branch `feat/GH-57-battery-site-monitoring`):**
- **Sites:** `features/sites/` mới + Site detail screen (customer + staff) + Sites overview section trên customer dashboard.
- **Ambient:** `features/ambient/` mới — tile "latest" + chart history/trend inline trong Site detail.
- **Cascade risk:** badge Low/Med/High trên Battery detail (customer + staff).
- **SSE realtime:** `react-native-sse` cho Battery detail (scope `asset:{id}`); polling `/realtime` giữ làm fallback.

**Ngoài scope:**
- Admin/Manager endpoints (`/api/sites`, `cascade-risk-summary`, `topology` set, threshold-configs, environmental-incidents) — không thuộc app Customer/Staff.
- SSE scope `customer`/`site` cho dashboard live tile (đã chốt: chỉ battery detail).
- Màn hình report `ambient-trend` riêng (đã chốt: vẽ chart inline trong Site detail).
- Redesign dashboard / `EnergyFlowDiagram` (đang là mock UI — không đụng).
- Export CSV/XLSX của report.

## Endpoints
| Method | Path | Mục đích / Ghi chú |
|--------|------|--------------------|
| GET | `/api/sites/me` | List site của customer (`PaginationResponse<SiteDto>`) |
| GET | `/api/sites/{id}` | Chi tiết site (`CommonResponse<SiteDto>`) |
| GET | `/api/sites/{id}/dashboard` | Stats site (`CommonResponse<SiteDashboardDto>`: totalAssets, activeAssets, assetsWithActiveAlerts, healthScore...) |
| GET | `/api/sites/{id}/assets` | Pin trong site (`PaginationResponse<BatteryAssetDto>`) — route param tên `id` |
| GET | `/api/ambient/readings/latest?siteId=` | Ambient mới nhất (`CommonResponse<AmbientReadingDto>`) — **404 nếu site chưa có reading** |
| GET | `/api/ambient/readings/history?siteId=&from=&to=&pageNumber=&pageSize=` | Lịch sử ambient — **offset pagination**, sort Time DESC |
| GET | `/api/reports/ambient-trend?siteId=&from=&to=&granularity=` | Trend (`CommonResponse<List<AmbientTrendPoint>>`) — mặc định 30 ngày/day |
| GET | `/api/battery-assets/{id}/cascade-risk` | Cascade risk (`CommonResponse<CascadeRiskDto>`) — `level`/`electricalTopology` là **string** |
| GET (SSE) | `/api/sensor-readings/stream?scope=asset:{id}&access_token={JWT}` | `text/event-stream`. **Contract chính thức: `docs/battery-realtime-description.md` §3/§5** (KHÔNG có trong `api-battery.md` — đây là doc realtime riêng). Event `reading` = 1 reading đầy đủ; `ping` `{}` mỗi 30s keepalive. Auth: native EventSource không set được header → token qua query `?access_token=`. **Field null bị lược khỏi JSON** (vắng mặt = null). KHÔNG có `id:`/replay → reconnect phải re-seed bằng REST `/latest`. |

> **[P0 resolved]** SSE endpoint có thật và **được document chính thức** tại `docs/battery-realtime-description.md` (313 dòng, Sprint BE-IoT-Realtime). `api-battery.md` không liệt kê vì realtime tách doc riêng — không phải "nguồn ngoài contract". Mọi field/RBAC/edge case dưới đây trích từ doc này, không phải đọc code controller.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/endpoints.ts` | modify | Thêm `SITES`, `AMBIENT`, `REPORTS`, `BATTERY_ASSETS.CASCADE_RISK`, `SENSOR_READINGS.STREAM` |
| `src/lib/queryKeys.ts` | modify | Thêm `KEY.sites`, `KEY.ambient`; `QUERY_KEY.sites.*`, `QUERY_KEY.ambient.*`, `QUERY_KEY.batteryAssets.cascadeRisk` |
| **Sites** | | |
| `src/features/sites/enums/site.enum.ts` | create | `SiteStatusEnum` (number) |
| `src/features/sites/types/site.types.ts` | create | `SiteDto`, `SiteDashboardDto` (re-export enum). **`SiteDashboardDto` (doc :1051-1062) đủ field:** `siteId`, `name`, `customerId`, `totalAssets`, `activeAssets`, `assetsWithActiveAlerts`, `lastAlertAt: string\|null`, `healthScore`. ⚠️ **KHÔNG có `capacityKw`/`totalCapacityKw`** (doc :1127 cảnh báo rõ) — không tự thêm field |
| `src/features/sites/services/site.service.ts` | create | getMySites, getById, getDashboard, getAssets |
| `src/features/sites/hooks/useMySites.ts` | create | `useQuery` list |
| `src/features/sites/hooks/useSiteDetail.ts` | create | |
| `src/features/sites/hooks/useSiteDashboard.ts` | create | staleTime 1 phút |
| `src/features/sites/hooks/useSiteAssets.ts` | create | |
| `src/features/sites/components/SiteCard.tsx` | create | Card cho overview + list (tên, address, healthScore badge) |
| `src/features/sites/components/SiteHealthBadge.tsx` | create | Màu theo ngưỡng 80/50 (xanh/vàng/đỏ) |
| **Ambient** | | |
| `src/features/ambient/enums/ambient.enum.ts` | create | `AmbientReadingSourceEnum` (number) |
| `src/features/ambient/types/ambient.types.ts` | create | `AmbientReadingDto` (`time`, `siteId`, `ambientTemperature`, `humidity?`, `solarIrradiance?`, `source`, `sourceDeviceId?`). **`AmbientTrendPoint` (doc :2632-2639) — chú ý naming bất đối xứng:** `date`, `avgTemp`, `maxTemp`, `minTemp`, **`humidityAvg?`**, **`irradianceAvg?`** (temp dùng prefix `avg*`; humidity/irradiance dùng suffix `*Avg` — dễ map sai key) |
| `src/features/ambient/services/ambient.service.ts` | create | getLatest, getHistory, getTrend |
| `src/features/ambient/hooks/useAmbientLatest.ts` | create | `retry: false` (404 = chưa có data, không retry) |
| `src/features/ambient/hooks/useAmbientTrend.ts` | create | |
| `src/features/ambient/components/AmbientTile.tsx` | create | Temp/humidity/irradiance hiện tại |
| `src/features/ambient/components/AmbientTrendChart.tsx` | create | Victory Native — avg/max/min temp 30 ngày |
| **Cascade (mở rộng batteries)** | | |
| `src/features/batteries/enums/cascade.enum.ts` | create | `CascadeRiskLevel` + `ElectricalTopologyEnum` (**string-valued**) |
| `src/features/batteries/types/cascade.types.ts` | create | `CascadeRiskDto` |
| `src/features/batteries/services/battery.service.ts` | modify | Thêm `getCascadeRisk(id)` |
| `src/features/batteries/hooks/useCascadeRisk.ts` | create | `retry: false` (404 → ẩn badge) |
| `src/features/batteries/components/CascadeRiskBadge.tsx` | create | Badge Low/Med/High; null/404 → render null |
| **SSE realtime** | | |
| `package.json` | modify | `npm install react-native-sse` (pure JS, không rebuild dev client) |
| `src/features/batteries/types/live-reading.types.ts` | create | `LiveReadingDto` mirror doc realtime §5.3 — **chỉ 8 field non-null**: `batteryAssetId`, `customerId`, `time`, `voltage`, `current`, `temperature`, `socPercent`, `sourceType`; còn lại nullable: `siteId?`, `batteryTypeId?`, `sohPercent?`, `cycleCount?`, `chargingState?`, `internalResistanceMilliohm?`, `cellVoltageDeltaMv?`, `bmsErrorCode?`, `sourceDeviceId?`, `sensorSourceCode?` |
| `src/features/batteries/hooks/useBatterySensorStream.ts` | create | EventSource scope `asset:{id}` + `?access_token=`; chỉ nhận `sensorSourceCode==='primary'` (hoặc vắng); **merge field whitelist vào cache realtime (KHÔNG đè nguyên payload — xem Approach)**; bỏ qua `ping`; swallow lỗi |
| **Screens** | | |
| `app/(customer)/sites/[id].tsx` | create | Site detail: dashboard stats + assets list + AmbientTile + AmbientTrendChart |
| `app/(staff)/sites/[id].tsx` | create | Site detail cho staff (reuse components) |
| `app/(customer)/(tabs)/dashboard.tsx` | modify | Thêm "Sites" overview section (SiteCard) phía trên "My Devices" |
| `app/(customer)/batteries/[id].tsx` | modify | Thêm `CascadeRiskBadge` + bật `useBatterySensorStream` + link tới site |
| `app/(staff)/batteries/[id].tsx` | modify | Thêm `CascadeRiskBadge` + `useBatterySensorStream` + link tới site |

## Approach
- **Enum mapping chuẩn:** `cascade-risk` trả `level`/`electricalTopology` dạng **string** (`"High"`, `"SeriesString"`) → enum string-valued. `SiteStatusEnum`/`AmbientReadingSourceEnum`/`BatteryStatus` trả **int** → enum number-valued (giống `BatteryStatusEnum` hiện có).
- **SSE (realtime augments, REST seed/fallback)** — theo triết lý `useTicketCommentsRealtime` (SignalR) + doc realtime §3/§5. `useBatterySensorStream(assetId)` mở `new EventSource(`${BASE_URL}/api/sensor-readings/stream?scope=asset:${assetId}&access_token=${token}`)` (react-native-sse). Token qua **query** (doc §3: native EventSource không set header). Nghe event `reading` → parse → nếu `batteryAssetId` khớp **và** `sensorSourceCode` là `primary`/vắng → cập nhật cache.
  - **⚠️ Merge bằng field whitelist, KHÔNG đè nguyên payload.** Cache `QUERY_KEY.batteryAssets.realtime(id)` giữ `BatteryAssetRealtimeDto` (api-battery.md:464-479) — key là **`assetId`** (SSE dùng **`batteryAssetId`**, tên khác), và có `serialNumber`/`status`/`activeAlerts` mà SSE **không** mang. Phải:
    ```ts
    queryClient.setQueryData<BatteryAssetRealtimeDto>(QUERY_KEY.batteryAssets.realtime(id), (old) =>
      old ? { ...old, voltage, current, temperature, socPercent, sohPercent, time, chargingState } : old);
    ```
    Nếu `setQueryData` đè cả object SSE → mất `serialNumber/status/activeAlerts`, `assetId` thành `undefined` → UI battery detail vỡ phần status/alert. **Field SSE vắng = null** (doc §5.3 lược null) → whitelist trên là an toàn (gán null khi vắng). Skip update khi `old` chưa có (chờ polling seed trước).
  - Bỏ qua `ping`. Lỗi connect/parse → swallow; `useBatteryAssetRealtime` (poll 30s) vẫn seed + fallback nên UI không vỡ. **Reconnect không replay** (doc §3) → polling chính là cơ chế re-seed. **`Realtime:Enabled=false`** → stream chỉ có `ping`, coi là hợp lệ, không treo. Cleanup: `es.removeAllEventListeners()` + `es.close()` trong return `useEffect`.
  - **[P3 nit]** Sau khi stream mở 200, lỗi (vd 403 token hết hạn giữa chừng) chỉ về qua `error` chung của EventSource (doc §8). Scope này **swallow + giữ polling là đủ**; tùy chọn nâng cao (không bắt buộc): phân biệt 403 → ngừng reconnect vs lỗi mạng → cho reconnect.
- **RBAC SSE (doc §6):** Customer chỉ mở `asset:` cho **pin mình sở hữu** (id lạ → 403 toàn bộ); Staff mở `asset:` cho **bất kỳ** pin. Scope `asset:{id}` ta dùng hợp lệ cho cả 2 role.
- **Site detail data flow:** `useSiteDetail(id)` + `useSiteDashboard(id)` + `useSiteAssets(id)` + `useAmbientLatest(siteId)` + `useAmbientTrend(siteId)` — render độc lập, mỗi block tự loading/empty.
- **Dashboard overview:** thêm `useMySites()`; render danh sách `SiteCard` (tap → `/(customer)/sites/[id]`). Không refactor `EnergyFlowDiagram`/`BatteryCard` sẵn có.
- **Cascade badge:** `useCascadeRisk(assetId)` `retry:false`; có data → badge màu theo `level`; lỗi/null → ẩn.

## Edge Cases
- `/sites/me` rỗng → ẩn section Sites trên dashboard (không hiện khối trống).
- `/ambient/readings/latest` **404** (site chưa có reading) → AmbientTile hiện "Chưa có dữ liệu môi trường", không retry.
- `cascade-risk` **404** (asset không tồn tại) hoặc `siteId` null → ẩn badge.
- `ambient-trend`/`history` rỗng → chart hiện empty state.
- **SSE:** token hết hạn / connect fail / event của asset khác → swallow + giữ polling; không spam reconnect khi unmount. Field null bị lược (vắng = null). `Realtime:Enabled=false` → chỉ `ping`, không treo chờ data. Reconnect không replay → dựa polling re-seed. Bỏ event `sensorSourceCode` `redundant`/`external-temp` (chỉ vẽ `primary`).
- **expo-router typed routes:** route mới `sites/[id].tsx` sẽ làm `tsc`/check-build FAIL tới khi regenerate `.expo/types` — chạy `expo start` (free port) rồi dừng để gen types (xem [[expo-router-typed-routes-pitfall]]).
- Decimal từ BE (cascadeRiskScore, ambientTemperature...) → JSON number; format `.toFixed()` khi hiển thị.

## Acceptance Criteria
- [ ] Customer dashboard hiện section "Sites" liệt kê site từ `/sites/me` kèm health score badge đúng màu (≥80 xanh / 50–79 vàng / <50 đỏ).
- [ ] Tap site → Site detail hiện: stats dashboard (totalAssets/activeAssets/assetsWithActiveAlerts/healthScore), danh sách assets, AmbientTile (latest), AmbientTrendChart.
- [ ] Battery detail (customer + staff) hiện CascadeRiskBadge đúng level/màu; ẩn khi 404/không có site.
- [ ] Battery detail realtime cập nhật qua SSE `reading`; khi SSE fail vẫn cập nhật qua polling (verify bằng tắt mạng SSE / chờ 30s).
- [ ] Staff battery detail có link mở Site detail từ `siteId`.
- [ ] `npx tsc --noEmit` + `npx eslint . --max-warnings=0` PASS (sau khi regenerate expo types).

## Steps
- [x] Bước 1: `endpoints.ts` + `queryKeys.ts` — thêm path & key cho sites/ambient/cascade/stream — 2026-06-28
- [x] Bước 2: Enums + Types (site, ambient, cascade, live-reading) — 2026-06-28
- [x] Bước 3: Services (site.service, ambient.service, battery.service.getCascadeRisk) — 2026-06-28
- [x] Bước 4: Hooks (sites, ambient, cascade, `useBatterySensorStream` SSE) — `react-native-sse` cài xong — 2026-06-28
- [x] Bước 5: Components (SiteCard, SiteHealthBadge, AmbientTile, AmbientTrendChart, CascadeRiskBadge) — AmbientTrendChart dùng react-native-svg thay Victory (nhất quán SensorChart, ko thêm package) — 2026-06-28
- [x] Bước 6: Screens — Site detail (customer+staff), Sites section vào dashboard, cascade badge + SSE + site link vào battery detail — 2026-06-28
- [x] Bước 7: Regenerate expo types → `tsc --noEmit` PASS (0 errors); `expo lint` 0 errors (chỉ warning enum-pattern chuẩn sẵn có) — 2026-06-28

## Câu hỏi đã giải đáp
1. **Scope (4 sub-feature):** làm cả 4 trong 1 branch, commit theo từng sub-feature.
2. **SSE:** thêm `react-native-sse` cho Battery detail (scope `asset:{id}`); giữ polling `/realtime` làm fallback.
3. **Dashboard:** thêm Sites overview vào customer dashboard hiện có (không redesign) + screen Site detail mới.
4. **Cascade + Ambient:** cascade badge ở battery detail; ambient (tile latest + chart history/trend inline) ở site detail. Không làm screen ambient-trend riêng.
5. **[P0] SSE contract:** `/sensor-readings/stream` **được document chính thức** tại `docs/battery-realtime-description.md` (không nằm trong `api-battery.md` vì realtime tách doc riêng). Event `reading` (field §5.3, camelCase, **null bị lược**), `ping` 30s, auth `?access_token=`, không replay (re-seed REST), RBAC §6. Cascade `level`/`topology` trả string.
6. **[P2] Review feedback:** `SiteDashboardDto` liệt kê đủ field + **không có `capacityKw`** (doc :1127). `AmbientTrendPoint` naming bất đối xứng `avgTemp`/`maxTemp`/`minTemp` vs `humidityAvg?`/`irradianceAvg?` — đã ghi rõ ở Files để tránh map sai key.
