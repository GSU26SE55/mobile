# Plan — GH-74: Sync wire-value enums + aggregate min/max nạp-xả + SSE stats (Sprint Bonus NS-01/02/03/04)

## Metadata
- **Status:** REVIEWING | **Role:** Mobile | **Ngày:** 2026-07-17
- **Issue:** #74 — https://github.com/GSU26SE55/mobile/issues/74
- **Sprint:** Sprint 5 (due 2026-07-25)
- **Dev:** Trần Minh Trí (SE183109)

## Mục tiêu
Đồng bộ contract Mobile với BE Sprint Bonus NS-01/02/03/04: mirror 4 wire value còn lệch, mở rộng `SensorReadingAggregateDto` với khối min/max nạp-xả, thêm endpoint `/aggregate/hourly`, dựng chart "Nạp/Xả đỉnh", và wire SSE event `stats` vào cả 2 stream hook.

## Scope

**Trong scope:**
- 4 wire value: `AnomalyTypeEnum.Undertemp`, `NotificationTypeEnum.CascadeRiskHigh`, `TicketOriginEnum.System`, `AlertDto.siteId`
- 13 field mới trên `SensorReadingAggregateDto`
- Endpoint + service + hook cho `/aggregate/hourly`, auto-switch khi range > 7 ngày
- Component chart "Nạp/Xả đỉnh" (Victory Native) trên cả 2 màn battery detail (customer + staff)
- SSE event `stats` (window `1h` + `today`) trên `useBatterySensorStream` + `useBatteryFleetStream`
- Dòng min/max trên mỗi item pin ở customer dashboard

**Ngoài scope:**
- Environmental manual, IoT full API key, AI feedback — chức năng **Admin**, thuộc issue bên FE
- Không đổi `ProgressListItem` (shared với staff dashboard) — chỉ nối chuỗi `caption`
- Không refactor `SensorChart.tsx` hiện có (vẫn `react-native-gifted-charts`)
- Không đụng staff dashboard

## Enums

| Enum | File nguồn | Thay đổi |
|------|-----------|----------|
| `AnomalyTypeEnum` | `src/shared/enums/alert.enum.ts` | **+ `Undertemp: 16`** |
| `NotificationTypeEnum` | `src/features/notifications/enums/notification.enum.ts` | **+ `CascadeRiskHigh: 15`** (thay comment `// 15 skip (theo BE)`) |
| `TicketOriginEnum` | `src/shared/enums/ticket.enum.ts` | **+ `System: 'System'`** |

> ⚠️ **Hai giá trị thuộc HAI enum khác nhau** — body issue gốc ghi gộp cả hai vào một enum là sai:
> - `CascadeRiskHigh: 15` → `NotificationTypeEnum` (`docs/api-notification.md:101`). Nhét vào `AnomalyTypeEnum` sẽ **đè `SensorMismatch: 15`**.
> - `Undertemp: 16` → `AnomalyTypeEnum` (`docs/api-battery.md:124`). Nhét vào `NotificationTypeEnum` sẽ **đè `BatteryAlertEscalationPending: 16`**.
>
> ⚠️ **`TicketOriginEnum` là enum CHUỖI, không mirror số 4.** `docs/api-ticket.md:2189` — TicketService dùng `JsonStringEnumConverter`, mọi enum trả/nhận dạng chuỗi. Số `4` ở `api-ticket.md:168` là wire value cross-service (BE↔BE), Mobile không thấy qua JSON.

## Types

```ts
// alert.types.ts — AlertDto thêm 1 field (docs/api-battery.md:286, NS-21 #661)
siteId: string | null;   // null với alert gắn 1 pin; có giá trị với alert cấp site

// sensor-reading.types.ts — SensorReadingAggregateDto thêm 13 field (docs/api-battery.md:865)
minVoltage: number | null;            maxVoltage: number | null;
minTemperature: number | null;        maxTemperature: number | null;
maxChargeCurrent: number | null;      minChargeCurrent: number | null;   avgChargeCurrent: number | null;
maxDischargeCurrent: number | null;   minDischargeCurrent: number | null; avgDischargeCurrent: number | null;
chargeSampleCount: number;            dischargeSampleCount: number;      // int, 0 nếu không có mẫu

// sensor-reading.types.ts — payload SSE stats (docs/battery-realtime-description.md §5.3bis)
export type StatsWindow = '1h' | 'today';

export interface BatteryStatsDto {
  batteryAssetId: string;
  customerId: string;
  siteId?: string | null;         // field null bị LƯỢC khỏi JSON SSE → optional
  window: StatsWindow;
  windowStart: string;            // ISO UTC
  maxChargeCurrent?: number | null;
  minChargeCurrent?: number | null;
  maxDischargeCurrent?: number | null;
  minDischargeCurrent?: number | null;
  chargeSampleCount: number;
  dischargeSampleCount: number;
  updatedAt: string;              // ISO UTC
}
```

## Endpoints

| Method | Path | Mục đích / Request / Response |
|--------|------|-------------------------------|
| GET | `/api/sensor-readings/{assetId}/aggregate/hourly` | Bucket cố định 1h từ TimescaleDB continuous aggregate — cho range dài. Query: `from?`, `to?` (**không có `interval`**). Response: `CommonResponse<SensorReadingAggregateDto[]>` — **cùng shape** `/aggregate`, sort `time` tăng dần |
| GET | `/api/sensor-readings/{assetId}/aggregate` | (đã có) — thêm 13 field min/max vào type. Range ≤ 7 ngày, `interval` linh hoạt |
| SSE | `/api/sensor-readings/stream` | (đã có) — đăng ký thêm event `stats` |

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/enums/alert.enum.ts` | modify | `AnomalyTypeEnum` += `Undertemp: 16` |
| `src/features/batteries/components/AssetAlertList.tsx` | modify | `ANOMALY_LABEL` += `Undertemp: 'Nhiệt độ thấp'` — **`Record<AnomalyTypeEnum, string>` toàn phần → tsc FAIL nếu thiếu** |
| `src/features/notifications/enums/notification.enum.ts` | modify | `NotificationTypeEnum` += `CascadeRiskHigh: 15` |
| `src/features/notifications/components/NotificationCard.tsx` | modify | `ICON_MAP` += `CascadeRiskHigh` (Partial → không vỡ build, nhưng thiếu thì rơi icon fallback) |
| `src/shared/enums/ticket.enum.ts` | modify | `TicketOriginEnum` += `System: 'System'` |
| `src/features/batteries/types/alert.types.ts` | modify | `AlertDto` += `siteId` |
| `src/features/batteries/types/sensor-reading.types.ts` | modify | Aggregate 13 field + `BatteryStatsDto` + `StatsWindow` |
| `src/lib/endpoints.ts` | modify | `SENSOR_READINGS.AGGREGATE_HOURLY` |
| `src/lib/queryKeys.ts` | modify | `sensorReadings.aggregateHourly(id, params)` + `sensorReadings.stats(id, window)` |
| `src/features/batteries/services/sensor-reading.service.ts` | modify | `getAggregateHourly(assetId, { from, to })` |
| `src/features/batteries/hooks/useSensorReadingAggregate.ts` | modify | Auto-switch `/aggregate/hourly` khi `hours > 168` |
| `src/features/batteries/hooks/useBatteryStats.ts` | **create** | `useQuery` đọc stats cache, seed từ `/aggregate` bucket cuối |
| `src/features/batteries/components/ChargeDischargeChart.tsx` | **create** | Victory Native — range band min/max nạp/xả |
| `src/features/batteries/hooks/useBatterySensorStream.ts` | modify | += event `stats` → `setQueryData` |
| `src/features/batteries/hooks/useBatteryFleetStream.ts` | modify | += event `stats` → `statsByAsset` Map |
| `app/(customer)/batteries/[id].tsx` | modify | render `<ChargeDischargeChart />` |
| `app/(staff)/batteries/[id].tsx` | modify | render `<ChargeDischargeChart />` |
| `app/(customer)/(tabs)/dashboard.tsx` | modify | nối min/max vào `caption` của `ProgressListItem` |
| `package.json` | modify | += `victory-native`, `@shopify/react-native-skia` |

## Approach

- **Enums (nhóm 1)** — thuần mirror giá trị, mỗi enum đúng 1 giá trị mới vào slot trống. `tsc` là lưới an toàn: `ANOMALY_LABEL` toàn phần bắt buộc thêm label cùng lúc.
- **Aggregate (nhóm 2)** — mọi field min/max là `| null` (doc chốt: bucket không có mẫu chiều nào → `null`, **không phải `0`** — 0A là giá trị đo hợp lệ). `useSensorReadingAggregate` nhận thêm range dài; `hours > 168` (7 ngày) → gọi `/aggregate/hourly` (bỏ `interval`), ngược lại giữ `/aggregate`. Query key tách riêng để 2 endpoint không đè cache nhau.
- **Chart** — component riêng, không nhét vào `SensorChart.tsx`: min/max cần **range band** (vùng giữa min–max) + đường avg, khác hẳn line chart đơn của SensorChart. Dòng nạp và xả BE **đều trả dương** → không xử lý dấu, vẽ 2 band cùng chiều dương.
- **SSE `stats` — lưu theo đúng pattern sẵn có của TỪNG hook** (xem ⚠️ dưới):
  - `useBatterySensorStream` (scope 1 pin) → `queryClient.setQueryData(QUERY_KEY.sensorReadings.stats(assetId, window))` — khớp cách hook này đã xử lý event `reading`. Detail screen đọc qua `useBatteryStats`.
  - `useBatteryFleetStream` (scope nhiều pin) → `statsByAsset: Map<assetId, Partial<Record<StatsWindow, BatteryStatsDto>>>` local state — khớp cách hook này đã xử lý `liveByAsset`.
- **Backfill** — `stats` chỉ đẩy incremental (doc §5.3bis). Mở màn chưa có event → `useBatteryStats` seed từ bucket cuối của `/aggregate` để UI không trống, `stats` đến thì đè.

> ⚠️ **Vì sao 2 hook lưu khác nhau (lệch câu trả lời "TanStack Query cache" ban đầu):**
> `dashboard.tsx` render pin bằng `renderItem` — là **callback, không phải component**. Gọi `useQuery` trong đó **vỡ rules-of-hooks** (team đã dính ở GH-47). Fleet hook cũng đã có comment nội bộ *"KHÔNG quản state bằng TanStack Query (SSE là push, không phải query)"* và dùng Map cho `liveByAsset`. Ép fleet vào query cache sẽ buộc phải tách thêm component con chỉ để gọi hook — thêm việc, lệch pattern của chính hook đó. Nên: asset stream → query cache (đúng lựa chọn của bạn, khớp pattern của nó), fleet stream → Map (khớp pattern của nó). Mỗi màn có nguồn stats riêng, không chia sẻ chéo.

## Edge Cases

- **Field null bị LƯỢC khỏi JSON SSE** (doc §5.3) → `BatteryStatsDto` để `?: number | null`, đọc bằng `?? null`. Không dùng `field in obj`.
- **Pin idle cả window** → cả cụm min/max nạp lẫn xả `null` → UI hiện `—`, **không hiện `0`**.
- **`current == 0`** (idle) BE đã bỏ khỏi cả 2 chiều — Mobile không tự tính, chỉ hiển thị.
- **`Realtime:Enabled=false`** → không có event `stats` (giống `reading`/`summary`). Đây là **trạng thái hợp lệ, không phải lỗi** — UI giữ giá trị seed từ `/aggregate`, không treo spinner.
- **`stats` sai pin** → sensor stream lọc `dto.batteryAssetId !== assetId` → bỏ (như event `reading`).
- **JSON parse lỗi** → `try/catch` → bỏ qua event, giữ giá trị cũ (như pattern hiện có).
- **`window` lạ** (BE thêm window thứ 3) → bỏ qua, chỉ nhận `1h` | `today`.
- **`AlertDto.siteId`** — alert cấp site có `batteryAssetId === ""` và `batterySerialNumber === ""` (doc:285/287). UI không được fetch pin theo chuỗi rỗng.
- **`/aggregate/hourly`** — `422` khi `from > to`; `400` khi `assetId` rỗng. Lỗi field-level qua `listErrors` → `handleErrorApi`.
- **Bucket rỗng giữa range** → `/aggregate` không trả bucket trống → chart phải chấp nhận gap, không nội suy thành 0.

## Acceptance Criteria

- [ ] `AnomalyTypeEnum.Undertemp === 16`, `SensorMismatch` vẫn `=== 15` (không bị đè)
- [ ] `NotificationTypeEnum.CascadeRiskHigh === 15`, `BatteryAlertEscalationPending` vẫn `=== 16` (không bị đè)
- [ ] `TicketOriginEnum.System === 'System'` (chuỗi, không phải số)
- [ ] `ANOMALY_LABEL` có nhãn tiếng Việt cho `Undertemp`; `ICON_MAP` có icon cho `CascadeRiskHigh`
- [ ] `AlertDto.siteId` có kiểu `string | null`
- [ ] `SensorReadingAggregateDto` đủ 13 field mới, tất cả min/max là `| null`, 2 sampleCount là `number`
- [ ] `ENDPOINTS.SENSOR_READINGS.AGGREGATE_HOURLY(id)` trả đúng `/api/sensor-readings/{id}/aggregate/hourly`
- [ ] Chart range ≤ 7 ngày gọi `/aggregate`; range > 7 ngày gọi `/aggregate/hourly` (verify qua network log)
- [ ] Chart "Nạp/Xả đỉnh" hiện trên cả 2 màn battery detail; bucket không có mẫu → `—`, không phải `0`
- [ ] Cả 2 hook đăng ký listener `stats`; nhận event → UI cập nhật không cần reload
- [ ] Customer dashboard: mỗi item pin có min/max ở dòng caption
- [ ] UI toggle được window `1h` / `Hôm nay`
- [ ] `npx tsc --noEmit` sạch + `npx eslint . --max-warnings=0` sạch

## Steps

- [x] **Bước 1 — Spike Victory Native — 2026-07-17 — PASS (có 1 điểm hoãn, xem dưới)**
  - `victory-native@41.26.0` + `@shopify/react-native-skia@2.2.12` (Expo tự pin về version SDK 54 bảo chứng, nằm trong peer range `>=1.2.3 <3.0.0`).
  - `expo install --check`: không phàn nàn về 2 package mới (chỉ báo `expo@54.0.35 → 54.0.36`, lệch **có sẵn từ trước**, ngoài scope).
  - `tsc --noEmit` exit 0 với chart spike → **`null` trong `yKeys` HỢP LỆ** (`victory-native/dist/types.d.ts:20` `MaybeNumber = number | null | undefined`; `:128` yKeys constraint là `extends MaybeNumber`). Doc website ghi "yKeys must map to fields containing only numbers" là **nói gọn, không chính xác** — type thật cho phép null. → edge case "bucket null → gap" dùng `connectMissingData: false` (mặc định) là chạy được.
  - API chốt: `<AreaRange upperPoints={} lowerPoints={} />` + `<Line points={} />` trong `<CartesianChart data xKey yKeys>`.
  - `expo export --platform ios` bundle thành công (9.22 MB) với spike wire tạm → Metro resolve được cả 2 package.
  - `pod install` → **`react-native-skia (2.2.12)` vào `Podfile.lock`**, 123 pods, không lỗi → RN autolinking nhận native module (skia dùng RN autolink, KHÔNG phải expo-modules-autolinking — lệnh `expo-modules-autolinking search` không thấy gì là bình thường).
  - ⚠️ **CHƯA verify: compile native + render thật trên device.** Cần `npx expo run:ios` (~10–15 phút) + mắt người. **Hoãn sang Bước 7** — khi đó chart thật đã wire, verify 1 lần với chart thật thay vì 2 lần với chart rỗng. Bước 2–6 **không đụng victory-native**, nên kể cả Skia compile fail thì không có công nào bị phí.
  - ⚠️ **Phát sinh cho Bước 7:** `assets/` **không có font `.ttf` nào**. Victory Native cần Skia font (`useFont`) để vẽ nhãn trục — khác `gifted-charts` (nhãn bằng RN `<Text>`). Bước 7 phải chọn: thêm 1 file font vào assets, hoặc `font={null}` + tự vẽ nhãn bằng `<Text>` ngoài canvas Skia.
- [x] **Bước 2 — Enums + label maps — 2026-07-17.** 3 enum + `ANOMALY_LABEL` + `ICON_MAP` + `AlertDto.siteId`. Hook `check-build.sh` bắt đúng dự đoán của plan: thêm `Undertemp: 16` → `tsc` FAIL vì `ANOMALY_LABEL` là `Record` toàn phần → thêm label `'Nhiệt độ thấp'` → xanh. Verify không đè: `SensorMismatch` vẫn 15, `BatteryAlertEscalationPending` vẫn 16. (`ticket.enum.ts` có 2 chỗ `System: 'System'` — `TicketOriginEnum` mới thêm + `ActorRoleEnum` có sẵn; **2 enum khác nhau, không phải collision**.)
- [x] **Bước 3 — Types — 2026-07-17.** 13 field aggregate + `BatteryStatsDto` + `StatsWindow` + `BatteryStatsView` + `statsDtoToView`.
- [x] **Bước 4 — Endpoint + service + queryKeys — 2026-07-17.** `AGGREGATE_HOURLY`, `getAggregateHourly` + `SensorReadingAggregateHourlyParams` (type riêng — hourly KHÔNG có `interval`), `aggregateHourly` + `stats` key factory.
- [x] **Bước 5 — Hooks — 2026-07-17.** `useSensorReadingAggregate` auto-switch; `useBatteryStats` seed từ `/aggregate` bucket cuối, `staleTime: Infinity` (refetch sẽ đè ngược data SSE mới hơn).
- [x] **Bước 6 — SSE `stats` — 2026-07-17.** `useBatterySensorStream` → `setQueryData(stats(assetId, window))`; `useBatteryFleetStream` → `statsByAsset: Map<assetId, AssetStats>`.
- [x] **Bước 7 — Component + màn — 2026-07-17.** `ChargeDischargeChart` (`AreaRange` band nạp + xả, `font` không truyền → nhãn X bằng RN `<Text>`, không thêm asset font) + wire 2 màn detail + caption dashboard.
- [x] **Bước 8 — Quality gate — 2026-07-17.** `tsc --noEmit` **PASS** (exit 0). `eslint` **0 errors / 67 warnings** — nhưng `dev` cũng **đúng 67 warnings**, diff này thêm **0 warning**; 2 file mới tạo lint sạch tuyệt đối. Xem mục ⚠️ dưới.

### ⚠️ Sai lệch so với plan gốc phát hiện lúc implement

**1. Luật auto-switch hourly phải thêm điều kiện `interval === '1h'`** (Bước 5).
Plan gốc ghi "auto-switch khi `hours > 168`". Nếu làm đúng vậy thì `SensorChart` range **`30d` (720h, interval `1d`, 30 bucket)** sẽ bị đẩy sang `/aggregate/hourly` → nhận **720 bucket, gấp 24 lần**, đổi hình dạng chart + hiệu năng của component **NGOÀI scope ticket** → vi phạm "Surgical Changes".
Luật đúng theo ngữ nghĩa doc L957 ("range dài **+ interval 1h cố định**"): `hours > 168 && interval === '1h'`. Kết quả: toàn bộ 4 range của `SensorChart` giữ nguyên hành vi cũ (`1h`/`24h`/`7d` ≤ 168h; `30d` dùng interval `1d`). Chỉ `ChargeDischargeChart` (30d + interval `1h`) đi vào hourly.

**2. Thêm `BatteryStatsView` + `statsDtoToView`** (Bước 3, ngoài danh sách type của plan).
Seed REST `/aggregate` **không có** `customerId`/`batteryAssetId` mà `BatteryStatsDto` (shape wire SSE) bắt buộc có → ép seed vào DTO sẽ phải **bịa dữ liệu**. Tách `BatteryStatsView` = shape UI thật sự cần, cả 2 nguồn (SSE + seed) map về; cờ `isSeed` phân biệt.

**3. `eslint --max-warnings=0` FAIL — nhưng fail sẵn trên `dev`.**
67 warnings (40 `no-redeclare` + 20 `no-unused-vars` + 3 `exhaustive-deps`). `no-redeclare` là hệ quả của chính pattern `as const` + type alias mà rule dự án **bắt buộc** dùng. Đếm trên `dev`: **cũng đúng 67**. Không sửa trong ticket này (ngoài scope, "Surgical Changes") → **cần Leader quyết**: chấp nhận, hay tách issue chore riêng để chỉnh `eslint.config.js`/CI.

**4. Không thêm file font** (Bước 7). `axisOptions.font` type là `SkFont | null` → bỏ qua được. Nhãn trục X vẽ bằng RN `<Text>` ngoài canvas Skia → giữ typography nhất quán app, tránh thêm asset.

## Rủi ro / Blocker

| Rủi ro | Ảnh hưởng | Xử lý |
|--------|-----------|-------|
| **BE chưa deploy event `stats`** | Không test được nhóm 3 end-to-end | Nhóm 1+2 độc lập, ship được. Nếu tới `/kltn-ship` mà BE chưa lên → **cắt nhóm 3 ra issue riêng**, không giữ nhóm 1+2 làm con tin |
| **Skia không tương thích Expo SDK 54 / RN 0.81** | Chặn chart | Bước 1 là spike — phát hiện sớm trước khi viết code chart. Fallback: `gifted-charts` |
| **2 lib chart song song** | Bundle size + 2 style chart lệch nhau | Chấp nhận (Leader duyệt). Nếu Bước 1 fail → về 1 lib |
| `.claude/rules/tech/mobile.md` ghi "Charts \| Victory Native" nhưng repo dùng `gifted-charts` | Rule lệch thực tế | Ngoài scope ticket — sync rule sau khi chốt Bước 1 |

## Câu hỏi đã giải đáp

| Câu hỏi | Kết luận |
|---------|----------|
| `CascadeRiskHigh: 15` vào enum nào? | **`NotificationTypeEnum`**, không phải `AnomalyTypeEnum` (sẽ đè `SensorMismatch: 15`). Body issue gốc sai → sửa khi post plan |
| `Undertemp: 16` vào enum nào? | `AnomalyTypeEnum` — slot 16 trống |
| `TicketOrigin.System` gửi số hay chuỗi? | **Chuỗi `'System'`** — `JsonStringEnumConverter` (`api-ticket.md:2189`). Số 4 là cross-service BE↔BE |
| `stats` lưu ở đâu? | Query cache cho asset stream; Map cho fleet stream (rules-of-hooks — xem ⚠️ mục Approach) |
| Chart đặt đâu? | Component **riêng** trên cả 2 màn battery detail — min/max cần range band, khác line chart của `SensorChart` |
| `AGGREGATE_HOURLY` dùng khi nào? | Wire luôn — range > 7 ngày tự chuyển (doc L957) |
| Fleet stats hiển thị gì? | Dòng min/max mỗi item pin ở customer dashboard |
| Window nào? | Cả `1h` + `today`, UI cho chọn |
| Chart lib? | **Victory Native** (Leader duyệt). `expo-dev-client` + reanimated + gesture-handler đã có sẵn → chỉ thiếu `@shopify/react-native-skia` |
| "BatteryCard" ở đâu? | **Không tồn tại** — dashboard dùng `ProgressListItem` (shared) qua prop `caption`. Nối chuỗi trong `renderItem`, không sửa component shared |
